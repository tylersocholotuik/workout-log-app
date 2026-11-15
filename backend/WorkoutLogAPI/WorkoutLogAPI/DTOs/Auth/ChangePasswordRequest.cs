using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Auth;

public record ChangePasswordRequest(
    [param: Required(ErrorMessage = "Current password is required")]
    [param: StringLength(100, MinimumLength = 6, ErrorMessage = "Current password must be between 6 and 100 characters")]
    string CurrentPassword,
    [param: Required(ErrorMessage = "New password is required")]
    [param: StringLength(100, MinimumLength = 6, ErrorMessage = "New password must be between 6 and 100 characters")]
    string NewPassword);