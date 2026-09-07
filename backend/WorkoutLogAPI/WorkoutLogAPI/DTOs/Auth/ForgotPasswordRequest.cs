using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Auth;

public record ForgotPasswordRequest(
    [param: Required(ErrorMessage = "Email is required")]
    [param: EmailAddress(ErrorMessage = "Invalid email address")]
    string Email
);