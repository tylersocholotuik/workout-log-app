using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Auth;

public record LoginRequest(
    [param: Required(ErrorMessage = "Email is required")]
    [param: EmailAddress(ErrorMessage = "Invalid email address")]
    string Email,

    [param: Required(ErrorMessage = "Password is required")]
    string Password);
