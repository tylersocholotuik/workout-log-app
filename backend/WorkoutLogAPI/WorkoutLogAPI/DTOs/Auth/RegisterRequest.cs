using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Auth;

public record RegisterRequest(
    [param: Required(ErrorMessage = "Email is required")]
    [param: EmailAddress(ErrorMessage = "Invalid email address")]
    [param: StringLength(255, ErrorMessage = "Email must be less than 255 characters")]
    string Email,

    [param: Required(ErrorMessage = "First name is required")]
    [param: StringLength(50, ErrorMessage = "First name must be less than 50 characters")]
    string FirstName,

    [param: Required(ErrorMessage = "Last name is required")]
    [param: StringLength(50, ErrorMessage = "Last name must be less than 50 characters")]
    string LastName,

    [param: StringLength(25, ErrorMessage = "Display name must be less than 25 characters")]
    string? DisplayName,

    [param: Required(ErrorMessage = "Password is required")]
    [param: StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    string Password);
