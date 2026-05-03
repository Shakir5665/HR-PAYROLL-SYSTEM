using HRPayNexus.Domain.Enums;

namespace HRPayNexus.Application.Common.DTOs;

public record LeaveRequestDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    decimal AnnualLeaveBalance,
    DateTime StartDate,
    DateTime EndDate,
    string Reason,
    LeaveStatus Status,
    string? AdminComment,
    DateTime RequestedAt
);

public record CreateLeaveRequest(
    DateTime StartDate,
    DateTime EndDate,
    string Reason
);

public record UpdateLeaveStatusRequest(
    LeaveStatus Status,
    string? AdminComment
);
