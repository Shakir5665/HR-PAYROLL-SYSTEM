using HRPayNexus.Application.Common.DTOs;
using HRPayNexus.Application.Common.Interfaces;
using HRPayNexus.Domain.Entities;
using HRPayNexus.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRPayNexus.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class LeaveController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public LeaveController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeaveRequestDto>>> GetLeaves()
    {
        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        var subClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value 
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(subClaim)) return Unauthorized();
        
        var query = _context.LeaveRequests.Include(l => l.Employee).AsQueryable();

        if (userRole == "Employee")
        {
            var userId = Guid.Parse(subClaim);
            query = query.Where(l => l.Employee.UserId == userId);
        }
        else if (userRole == "Manager")
        {
            var userId = Guid.Parse(subClaim);
            var manager = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
            if (manager != null)
            {
                query = query.Where(l => l.Employee.Department == manager.Department);
            }
        }

        var leaves = await query
            .OrderByDescending(l => l.RequestedAt)
            .Select(l => new LeaveRequestDto(
                l.Id,
                l.EmployeeId,
                l.Employee != null ? l.Employee.FullName : "Unknown",
                l.Employee != null ? l.Employee.AnnualLeaveBalance : 0,
                l.StartDate,
                l.EndDate,
                l.Reason,
                l.Status,
                l.AdminComment,
                l.RequestedAt
            ))
            .ToListAsync();

        return Ok(leaves);
    }

    [HttpPost]
    public async Task<ActionResult> RequestLeave([FromBody] CreateLeaveRequest request)
    {
        try 
        {
            if (request == null) return BadRequest("Request body is missing or malformed");

            var subClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                        ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (!Guid.TryParse(subClaim, out var userId)) return BadRequest("Invalid user ID format in token");
            
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);

            if (employee == null) return BadRequest($"Employee profile not found for User ID: {userId}. Please ensure your profile is properly initialized.");

            var leave = new LeaveRequest
            {
                Id = Guid.NewGuid(),
                EmployeeId = employee.Id,
                // Ensure dates are UTC for PostgreSQL
                StartDate = DateTime.SpecifyKind(request.StartDate, DateTimeKind.Utc),
                EndDate = DateTime.SpecifyKind(request.EndDate, DateTimeKind.Utc),
                Reason = request.Reason,
                Status = LeaveStatus.Pending,
                RequestedAt = DateTime.UtcNow
            };

            _context.LeaveRequests.Add(leave);
            await _context.SaveChangesAsync();

            return Ok("Leave requested successfully");
        }
        catch (Exception ex)
        {
            // Log and return detailed error for debugging
            Console.WriteLine($"[ERROR] RequestLeave: {ex.Message}");
            return StatusCode(500, $"Internal Server Error: {ex.Message} \n {ex.InnerException?.Message}");
        }
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateStatus(Guid id, UpdateLeaveStatusRequest request)
    {
        try
        {
            var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            if (!new[] { "Admin", "HR", "Manager" }.Contains(userRole))
            {
                return Forbid($"User role '{userRole}' is not authorized to update leave status.");
            }

            var leave = await _context.LeaveRequests
                .Include(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (leave == null) return NotFound();

            leave.Status = request.Status;
            leave.AdminComment = request.AdminComment;

            if (request.Status == LeaveStatus.Approved)
            {
                var startOfYear = new DateTime(DateTime.UtcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                
                // Get all approved leaves for this employee in the current year
                var yearLeaves = await _context.LeaveRequests
                    .Where(l => l.EmployeeId == leave.EmployeeId 
                             && l.Status == LeaveStatus.Approved 
                             && l.StartDate >= startOfYear 
                             && l.Id != id) // Exclude current if already in DB as approved
                    .ToListAsync();

                int totalUsed = yearLeaves.Sum(l => (l.EndDate.Date - l.StartDate.Date).Days + 1);
                
                // Add the days from the leave we are CURRENTLY approving
                int currentDays = (leave.EndDate.Date - leave.StartDate.Date).Days + 1;
                totalUsed += currentDays;
                
                if (totalUsed > 12)
                {
                    if (!leave.Reason.Contains("(Marked as Unpaid - Quota Exceeded)"))
                    {
                        leave.Reason += " (Marked as Unpaid - Quota Exceeded)";
                    }
                }

                leave.Employee.AnnualLeaveBalance = Math.Max(0, 12 - totalUsed);
            }
            else if (request.Status == LeaveStatus.Rejected || request.Status == LeaveStatus.Pending)
            {
                // If we reject a previously approved leave, we need to add the days back
                var startOfYear = new DateTime(DateTime.UtcNow.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                var yearLeaves = await _context.LeaveRequests
                    .Where(l => l.EmployeeId == leave.EmployeeId 
                             && l.Status == LeaveStatus.Approved 
                             && l.StartDate >= startOfYear
                             && l.Id != id) // Exclude current
                    .ToListAsync();

                int totalUsed = yearLeaves.Sum(l => (l.EndDate.Date - l.StartDate.Date).Days + 1);
                leave.Employee.AnnualLeaveBalance = Math.Max(0, 12 - totalUsed);
            }

            await _context.SaveChangesAsync();
            return Ok("Leave status updated");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Update failed: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteLeave(Guid id)
    {
        try
        {
            var leave = await _context.LeaveRequests.FindAsync(id);
            if (leave == null) return NotFound();

            // Industrial Rule: Approved leave cannot be deleted by anyone to preserve payroll integrity
            if (leave.Status == LeaveStatus.Approved)
            {
                return BadRequest("Approved leave records cannot be deleted to preserve historical payroll and audit integrity.");
            }

            var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            if (!new[] { "Admin", "HR", "Manager" }.Contains(userRole))
            {
                // Employees can only delete their own PENDING or REJECTED requests
                var subClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                            ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                
                var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == Guid.Parse(subClaim));
                if (employee == null || leave.EmployeeId != employee.Id)
                {
                    return Forbid("You can only delete your own leave requests.");
                }
            }

            _context.LeaveRequests.Remove(leave);
            await _context.SaveChangesAsync();

            return Ok("Leave request deleted");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Delete failed: {ex.Message}");
        }
    }
}
