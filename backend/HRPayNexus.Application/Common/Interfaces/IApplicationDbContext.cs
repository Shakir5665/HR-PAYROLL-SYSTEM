using HRPayNexus.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HRPayNexus.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Employee> Employees { get; }
    DbSet<LeaveRequest> LeaveRequests { get; }
    DbSet<PayrollRecord> PayrollRecords { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<Department> Departments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
