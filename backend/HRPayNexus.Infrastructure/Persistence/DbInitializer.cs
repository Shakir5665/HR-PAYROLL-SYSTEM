using HRPayNexus.Application.Common.Interfaces;
using HRPayNexus.Domain.Entities;
using HRPayNexus.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace HRPayNexus.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();

        await context.Database.EnsureCreatedAsync();
        
        // Create Departments table if it doesn't exist
        await context.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Departments"" (
                ""Id"" uuid NOT NULL,
                ""Name"" text NOT NULL,
                ""Description"" text,
                ""CreatedAt"" timestamp with time zone NOT NULL,
                CONSTRAINT ""PK_Departments"" PRIMARY KEY (""Id"")
            );
        ");

        // Add missing columns to PayrollRecords if they don't exist
        await context.Database.ExecuteSqlRawAsync(@"
            ALTER TABLE ""PayrollRecords"" ADD COLUMN IF NOT EXISTS ""UnpaidLeaveDeduction"" numeric DEFAULT 0;
            ALTER TABLE ""PayrollRecords"" ADD COLUMN IF NOT EXISTS ""PaidLeaveUsed"" integer DEFAULT 0;
            ALTER TABLE ""PayrollRecords"" ADD COLUMN IF NOT EXISTS ""UnpaidLeaveUsed"" integer DEFAULT 0;
            ALTER TABLE ""PayrollRecords"" ADD COLUMN IF NOT EXISTS ""LeaveOpeningBalance"" numeric DEFAULT 0;
            ALTER TABLE ""PayrollRecords"" ADD COLUMN IF NOT EXISTS ""LeaveClosingBalance"" numeric DEFAULT 0;

            -- One-time migration: Initialize all employees with the 12-day industrial quota if they are currently at 0
            UPDATE ""Employees"" SET ""AnnualLeaveBalance"" = 12 WHERE ""AnnualLeaveBalance"" = 0;
        ");

        if (!await context.Departments.AnyAsync())

        {
            var departments = new List<Department>
            {
                new Department { Id = Guid.NewGuid(), Name = "Human Resources", Description = "HR Management" },
                new Department { Id = Guid.NewGuid(), Name = "IT Engineering", Description = "Software & Infrastructure" },
                new Department { Id = Guid.NewGuid(), Name = "Finance", Description = "Accounting & Payroll" },
                new Department { Id = Guid.NewGuid(), Name = "Sales & Marketing", Description = "Revenue Generation" },
                new Department { Id = Guid.NewGuid(), Name = "Legal", Description = "Compliance & Law" }
            };
            context.Departments.AddRange(departments);
            await context.SaveChangesAsync();
        }

        if (!await context.Users.AnyAsync())
        {
            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@hrpaynexus.com",
                PasswordHash = passwordHasher.Hash("Admin@123"),
                Role = UserRole.Admin
            };

            var adminEmployee = new Employee
            {
                Id = Guid.NewGuid(),
                UserId = adminUser.Id,
                FullName = "System Administrator",
                EmployeeCode = "ADM-001",
                Department = "IT",
                Designation = "Super Admin",
                BaseSalary = 100000,
                JoinedDate = DateTime.UtcNow.AddYears(-1),
                AnnualLeaveBalance = 20,
                IsActive = true
            };

            context.Users.Add(adminUser);
            context.Employees.Add(adminEmployee);
            
            // Add some dummy employees for testing
            var hrUser = new User { Id = Guid.NewGuid(), Email = "hr@hrpaynexus.com", PasswordHash = passwordHasher.Hash("HR@123"), Role = UserRole.HR };
            var hrEmployee = new Employee { Id = Guid.NewGuid(), UserId = hrUser.Id, FullName = "HR Manager", EmployeeCode = "HR-001", Department = "HR", Designation = "HR Lead", BaseSalary = 75000, JoinedDate = DateTime.UtcNow.AddMonths(-6), AnnualLeaveBalance = 15 };
            
            var financeUser = new User { Id = Guid.NewGuid(), Email = "finance@hrpaynexus.com", PasswordHash = passwordHasher.Hash("Finance@123"), Role = UserRole.Finance };
            var financeEmployee = new Employee { Id = Guid.NewGuid(), UserId = financeUser.Id, FullName = "Finance Officer", EmployeeCode = "FIN-001", Department = "Finance", Designation = "Senior Accountant", BaseSalary = 80000, JoinedDate = DateTime.UtcNow.AddMonths(-8), AnnualLeaveBalance = 15 };

            context.Users.AddRange(hrUser, financeUser);
            context.Employees.AddRange(hrEmployee, financeEmployee);

            await context.SaveChangesAsync();
        }
    }
}
