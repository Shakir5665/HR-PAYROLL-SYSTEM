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
public class EmployeeController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public EmployeeController(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees()
    {
        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (!new[] { "Admin", "HR", "Finance" }.Contains(userRole))
        {
            return Forbid();
        }

        var employees = await _context.Employees
            .Include(e => e.User)
            .Select(e => new EmployeeDto(
                e.Id,
                e.UserId,
                e.FullName,
                e.EmployeeCode,
                e.Department,
                e.Designation,
                e.BaseSalary,
                e.JoinedDate,
                e.AnnualLeaveBalance,
                e.IsActive,
                e.User.Email
            ))
            .ToListAsync();

        return Ok(employees);
    }

    [HttpPost]
    public async Task<ActionResult<EmployeeDto>> CreateEmployee(CreateEmployeeRequest request)
    {
        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (userRole != "Admin" && userRole != "HR")
        {
            return Forbid();
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest("Email already exists");
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = Enum.Parse<UserRole>(request.Role)
        };

        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            FullName = request.FullName,
            EmployeeCode = $"EMP-{DateTime.UtcNow.Ticks.ToString().Substring(10)}",
            Department = request.Department,
            Designation = request.Designation,
            BaseSalary = request.BaseSalary,
            JoinedDate = request.JoinedDate,
            AnnualLeaveBalance = 12, // Default leave balance
            IsActive = true
        };

        _context.Users.Add(user);
        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return Ok(new EmployeeDto(
            employee.Id,
            employee.UserId,
            employee.FullName,
            employee.EmployeeCode,
            employee.Department,
            employee.Designation,
            employee.BaseSalary,
            employee.JoinedDate,
            employee.AnnualLeaveBalance,
            employee.IsActive,
            user.Email
        ));
    }


    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateEmployee(Guid id, UpdateEmployeeRequest request)
    {
        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (userRole != "Admin" && userRole != "HR")
        {
            return Forbid("Only Admin or HR can update employee profiles.");
        }

        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        employee.FullName = request.FullName;
        employee.Department = request.Department;
        employee.Designation = request.Designation;
        employee.BaseSalary = request.BaseSalary;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteEmployee(Guid id)
    {
        var userRole = User.FindFirst("role")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
        if (userRole != "Admin" && userRole != "HR")
        {
            return Forbid("Only Admin or HR can delete employees.");
        }

        var employee = await _context.Employees
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employee == null) return NotFound();

        if (employee.User != null)
        {
            _context.Users.Remove(employee.User);
        }

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("me")]
    public async Task<ActionResult<EmployeeDto>> GetMyProfile()
    {
        var subClaim = User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value 
                    ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(subClaim)) return Unauthorized("User identification missing");

        if (!Guid.TryParse(subClaim, out var userId)) return BadRequest("Invalid ID format");
        
        var employee = await _context.Employees
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.UserId == userId);

        if (employee == null) return NotFound();

        return Ok(new EmployeeDto(
            employee.Id,
            employee.UserId,
            employee.FullName,
            employee.EmployeeCode,
            employee.Department,
            employee.Designation,
            employee.BaseSalary,
            employee.JoinedDate,
            employee.AnnualLeaveBalance,
            employee.IsActive,
            employee.User.Email
        ));
    }

    [HttpGet("departments")]
    [AllowAnonymous] // Allow anyone to see departments for onboarding if needed, or keep [Authorize] if it's already on the class.
    public async Task<ActionResult<IEnumerable<string>>> GetDepartments()
    {
        var departments = await _context.Departments
            .Select(d => d.Name)
            .OrderBy(n => n)
            .ToListAsync();
        
        return Ok(departments);
    }
}
