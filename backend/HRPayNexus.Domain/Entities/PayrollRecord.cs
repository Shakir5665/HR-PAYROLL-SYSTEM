namespace HRPayNexus.Domain.Entities;

public class PayrollRecord
{
    public Guid Id { get; set; }
    public Guid EmployeeId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal BaseSalary { get; set; }
    public decimal Allowances { get; set; }
    public decimal Overtime { get; set; }
    public decimal UnpaidLeaveDeduction { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal EPFEmployee { get; set; } // 8%
    public decimal EPFEmployer { get; set; } // 12%
    public decimal ETFEmployer { get; set; } // 3%
    public decimal NetSalary { get; set; }
    public int PaidLeaveUsed { get; set; }
    public int UnpaidLeaveUsed { get; set; }
    public decimal LeaveOpeningBalance { get; set; }
    public decimal LeaveClosingBalance { get; set; }
    public string? PayslipPdfUrl { get; set; }
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;

    public Employee Employee { get; set; } = null!;
}
