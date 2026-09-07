using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Auth;

public record ResetPasswordRequest(
    [param: Required(ErrorMessage = "New password is required")]
    [param: StringLength(100, MinimumLength = 6, ErrorMessage = "New password must be between 6 and 100 characters")]
    string NewPassword,
    [param: Required(ErrorMessage = "Token is required")]
    string Token);