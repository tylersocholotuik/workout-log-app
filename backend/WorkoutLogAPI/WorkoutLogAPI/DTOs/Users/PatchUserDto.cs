using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Users;

public record PatchUserDto(
    [param: EmailAddress(ErrorMessage = "Invalid email address")]
    [param: StringLength(255, ErrorMessage = "Email must be less than 255 characters")]
    string? Email,
    [param: StringLength(50, ErrorMessage = "First name must be less than 50 characters")]
    string? FirstName,
    [param: StringLength(50, ErrorMessage = "Last name must be less than 50 characters")]
    string? LastName,
    [param: StringLength(25, ErrorMessage = "Display name must be less than 25 characters")]
    string? DisplayName);