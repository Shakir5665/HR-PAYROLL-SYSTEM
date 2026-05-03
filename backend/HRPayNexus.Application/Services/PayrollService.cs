using HRPayNexus.Application.Common.Interfaces;
using HRPayNexus.Domain.Entities;
using HRPayNexus.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HRPayNexus.Application.Services;

public class PayrollService : IPayrollService
{
    private readonly IApplicationDbContext _context;

    public PayrollService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PayrollRecord> CalculateMonthlyPayrollAsync(Guid employeeId, int month, int year, decimal allowances = 0, decimal overtime = 0)
    {
        var employee = await _context.Employees
            .FirstOrDefaultAsync(e => e.Id == employeeId)
            ?? throw new Exception("Employee not found");

        var startOfMonth = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1).AddDays(-1);
        var startOfYear = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var yearLeaves = await _context.LeaveRequests
            .Where(l => l.EmployeeId == employeeId 
                    && l.Status == LeaveStatus.Approved 
                    && l.EndDate >= startOfYear 
                    && l.StartDate <= endOfMonth)
            .ToListAsync();

        int leavesBeforeMonth = 0;
        int leavesDuringMonth = 0;

        foreach (var leave in yearLeaves)
        {
            DateTime effectiveStart = (leave.StartDate < startOfYear ? startOfYear : leave.StartDate).Date;
            DateTime effectiveEnd = (leave.EndDate > endOfMonth ? endOfMonth : leave.EndDate).Date;

            if (effectiveEnd < startOfMonth.Date)
            {
                leavesBeforeMonth += (effectiveEnd - effectiveStart).Days + 1;
            }
            else if (effectiveStart >= startOfMonth.Date)
            {
                leavesDuringMonth += (effectiveEnd - effectiveStart).Days + 1;
            }
            else
            {
                leavesBeforeMonth += (startOfMonth.Date - effectiveStart).Days;
                leavesDuringMonth += (effectiveEnd - startOfMonth.Date).Days + 1;
            }
        }

        // Industrial Rule: 12 Paid Days Quota
        int annualQuota = 12;
        int totalPaidUsedUntilStart = Math.Min(annualQuota, leavesBeforeMonth);
        int totalPaidUsedUntilEnd = Math.Min(annualQuota, leavesBeforeMonth + leavesDuringMonth);
        
        int paidDaysThisMonth = totalPaidUsedUntilEnd - totalPaidUsedUntilStart;
        int unpaidDaysThisMonth = leavesDuringMonth > 0 ? Math.Max(0, leavesDuringMonth - paidDaysThisMonth) : 0;

        // Deduction Formula: (Salary / 30)
        decimal dailyRate = employee.BaseSalary / 30;
        decimal unpaidLeaveDeduction = leavesDuringMonth > 0 ? unpaidDaysThisMonth * dailyRate : 0;

        // Update Employee Ledger (Closing Balance)
        employee.AnnualLeaveBalance = Math.Max(0, annualQuota - (leavesBeforeMonth + leavesDuringMonth));

        decimal grossSalary = (employee.BaseSalary - unpaidLeaveDeduction) + allowances + overtime;

        // Sri Lankan Statutory Compliance
        decimal epfEmployee = Math.Max(0, grossSalary * 0.08m);
        decimal epfEmployer = Math.Max(0, grossSalary * 0.12m);
        decimal etfEmployer = Math.Max(0, grossSalary * 0.03m);

        decimal netSalary = Math.Max(0, grossSalary - epfEmployee);

        return new PayrollRecord
        {
            EmployeeId = employeeId,
            Month = month,
            Year = year,
            BaseSalary = employee.BaseSalary,
            Allowances = allowances,
            Overtime = overtime,
            UnpaidLeaveDeduction = unpaidLeaveDeduction,
            GrossSalary = grossSalary,
            EPFEmployee = epfEmployee,
            EPFEmployer = epfEmployer,
            ETFEmployer = etfEmployer,
            NetSalary = netSalary,
            PaidLeaveUsed = paidDaysThisMonth,
            UnpaidLeaveUsed = unpaidDaysThisMonth,
            LeaveOpeningBalance = Math.Max(0, annualQuota - leavesBeforeMonth),
            LeaveClosingBalance = employee.AnnualLeaveBalance,
            ProcessedAt = DateTime.UtcNow
        };
    }
}
