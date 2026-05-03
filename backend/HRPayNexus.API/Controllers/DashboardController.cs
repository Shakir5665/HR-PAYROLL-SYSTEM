using System.IdentityModel.Tokens.Jwt;
using HRPayNexus.Application.Common.Interfaces;
using HRPayNexus.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRPayNexus.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public DashboardController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        var subClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value 
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(subClaim)) return Unauthorized("User identification (sub/nameid) missing from token");

        if (!Guid.TryParse(subClaim, out var userId)) return BadRequest("Invalid user ID format in token");
        
        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (userRole == "Admin" || userRole == "HR" || userRole == "Finance")
        {
            var totalEmployees = await _context.Employees.CountAsync(e => e.IsActive);
            var pendingLeaves = await _context.LeaveRequests.CountAsync(l => l.Status == LeaveStatus.Pending);
            var totalPayrollThisMonth = await _context.PayrollRecords
                .Where(p => p.Month == DateTime.UtcNow.Month && p.Year == DateTime.UtcNow.Year)
                .SumAsync(p => p.NetSalary);

            var departmentStats = await _context.Departments
                .Select(d => new
                {
                    Code = d.Name.Length >= 3 ? d.Name.Substring(0, 3).ToUpper() : d.Name.ToUpper(),
                    Name = d.Name,
                    Count = _context.Employees.Count(e => e.Department == d.Name && e.IsActive)
                })
                .OrderByDescending(d => d.Count)
                .ToListAsync();

            return Ok(new
            {
                TotalEmployees = totalEmployees,
                PendingLeaves = pendingLeaves,
                TotalPayrollThisMonth = totalPayrollThisMonth,
                ActiveUsers = await _context.Users.CountAsync(),
                DepartmentStats = departmentStats
            });
        }
        else
        {
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
            if (employee == null) return NotFound();

            var myPendingLeaves = await _context.LeaveRequests.CountAsync(l => l.EmployeeId == employee.Id && l.Status == LeaveStatus.Pending);
            
            return Ok(new
            {
                LeaveBalance = employee.AnnualLeaveBalance,
                PendingRequests = myPendingLeaves,
                JoinedDate = employee.JoinedDate,
                Designation = employee.Designation
            });
        }
    }
}
