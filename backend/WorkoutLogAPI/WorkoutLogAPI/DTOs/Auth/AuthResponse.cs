namespace WorkoutLogAPI.DTOs.Auth;

public class AuthResponse
{
    public string Token { get; set; } = null!;
    public UserDto User { get; set; } = null!;
}
