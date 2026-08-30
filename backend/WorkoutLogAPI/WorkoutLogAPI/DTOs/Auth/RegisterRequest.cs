using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Auth;

public class RegisterRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email address")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "First name is required")]
    [StringLength(50, ErrorMessage = "First name must be less than 50 characters")]
    public string FirstName { get; set; } = null!;

    [Required(ErrorMessage = "Last name is required")]
    [StringLength(50, ErrorMessage = "Last name must be less than 50 characters")]
    public string LastName { get; set; } = null!;

    [StringLength(25, ErrorMessage = "Display name must be less than 25 characters")]
    public string? DisplayName { get; set; }

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    public string Password { get; set; } = null!;
}
