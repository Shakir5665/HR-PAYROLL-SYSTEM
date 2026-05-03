namespace HRPayNexus.Application.Common.DTOs;

public record LoginRequest(string Email, string Password);
public record LoginResponse(string AccessToken, string RefreshToken, UserDto User);
public record UserDto(Guid Id, string Email, string Role);
public record RefreshTokenRequest(string RefreshToken);
public record ChangeCredentialsRequest(string? NewEmail, string? NewPassword);


