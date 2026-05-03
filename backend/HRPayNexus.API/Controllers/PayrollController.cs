using HRPayNexus.Application.Common.DTOs;
using HRPayNexus.Application.Common.Interfaces;
using HRPayNexus.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HRPayNexus.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class PayrollController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IPayrollService _payrollService;
    private readonly IPayslipGenerator _payslipGenerator;

    public PayrollController(IApplicationDbContext context, IPayrollService payrollService, IPayslipGenerator payslipGenerator)
    {
        _context = context;
        _payrollService = payrollService;
        _payslipGenerator = payslipGenerator;
    }

    [HttpPost("process")]
    public async Task<ActionResult> ProcessPayroll(PayrollProcessRequest request)
    {
        try
        {
            var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            if (userRole != "Finance" && userRole != "Admin")
            {
                return Forbid("User not authorized to process payroll");
            }

            // Prevent duplicate payroll runs
            var exists = await _context.PayrollRecords
                .AnyAsync(p => p.Month == request.Month && p.Year == request.Year && (request.EmployeeId == null || p.EmployeeId == request.EmployeeId));

            if (exists) return BadRequest(request.EmployeeId == null ? "Bulk payroll already processed for this month" : "Payroll already processed for this employee for this month");

            if (request.EmployeeId.HasValue)
            {
                var overtime = request.OvertimeHours * request.OvertimeRate;
                var record = await _payrollService.CalculateMonthlyPayrollAsync(
                    request.EmployeeId.Value, 
                    request.Month, 
                    request.Year, 
                    request.Allowances, 
                    overtime);
                
                _context.PayrollRecords.Add(record);
                await _context.SaveChangesAsync();

                var emp = await _context.Employees.FindAsync(request.EmployeeId.Value);
                
                return Ok(new {
                    record.Id,
                    record.EmployeeId,
                    EmployeeName = emp?.FullName ?? "Unknown",
                    Department = emp?.Department ?? "Unknown",
                    record.BaseSalary,
                    record.Allowances,
                    record.Overtime,
                    record.UnpaidLeaveDeduction,
                    record.EPFEmployee,
                    record.EPFEmployer,
                    record.ETFEmployer,
                    record.GrossSalary,
                    record.NetSalary,
                    record.Month,
                    record.Year
                });
            }

            var employees = await _context.Employees.Where(e => e.IsActive).ToListAsync();
            var results = new List<PayrollRecord>();
            
            foreach (var employee in employees)
            {
                var record = await _payrollService.CalculateMonthlyPayrollAsync(employee.Id, request.Month, request.Year);
                _context.PayrollRecords.Add(record);
                results.Add(record);
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Payroll processed successfully for all active employees", Count = results.Count });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ERROR] ProcessPayroll: {ex.Message}");
            return StatusCode(500, $"Payroll Error: {ex.Message} \n {ex.InnerException?.Message}");
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<PayrollSummaryDto>>> GetHistory()
    {
        var subClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(subClaim)) return Unauthorized();

        if (!Guid.TryParse(subClaim, out var userId)) return BadRequest();
        
        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        IQueryable<PayrollRecord> query = _context.PayrollRecords.Include(p => p.Employee);

        if (userRole == "Employee")
        {
            query = query.Where(p => p.Employee.UserId == userId);
        }

        var history = await query
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .Select(p => new PayrollSummaryDto(
                p.Id,
                p.Employee.FullName,
                p.Month,
                p.Year,
                p.GrossSalary,
                p.NetSalary,
                p.ProcessedAt
            ))
            .ToListAsync();

        return Ok(history);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetPayrollDetails(Guid id)
    {
        var record = await _context.PayrollRecords
            .Include(p => p.Employee)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (record == null) return NotFound();

        // Check permission: Admin, Finance or the Employee themselves
        var subClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(subClaim)) return Unauthorized();
        
        if (!Guid.TryParse(subClaim, out var userId)) return BadRequest();

        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (userRole == "Employee" && record.Employee.UserId != userId)
        {
            return Forbid();
        }

        return Ok(new {
            record.Id,
            record.EmployeeId,
            EmployeeName = record.Employee.FullName,
            record.Employee.EmployeeCode,
            Department = record.Employee.Department,
            record.BaseSalary,
            record.Allowances,
            record.Overtime,
            record.UnpaidLeaveDeduction,
            record.EPFEmployee,
            record.EPFEmployer,
            record.ETFEmployer,
            record.GrossSalary,
            record.NetSalary,
            record.PaidLeaveUsed,
            record.UnpaidLeaveUsed,
            record.LeaveOpeningBalance,
            record.LeaveClosingBalance,
            record.Month,
            record.Year,
            record.ProcessedAt
        });
    }

    [HttpGet("{id}/payslip")]
    public async Task<IActionResult> DownloadPayslip(Guid id)
    {
        var record = await _context.PayrollRecords
            .Include(p => p.Employee)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (record == null) return NotFound();

        // Check permission: Admin, Finance or the Employee themselves
        var subClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(subClaim)) return Unauthorized();
        
        if (!Guid.TryParse(subClaim, out var userId)) return BadRequest();

        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (userRole == "Employee" && record.Employee.UserId != userId)
        {
            return Forbid();
        }

        var pdfBytes = _payslipGenerator.GeneratePdf(record, record.Employee);
        return File(pdfBytes, "application/pdf", $"Payslip_{record.Employee.EmployeeCode}_{record.Month}_{record.Year}.pdf");
    }
}
