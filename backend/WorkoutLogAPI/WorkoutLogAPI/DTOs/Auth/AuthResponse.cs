using WorkoutLogAPI.DTOs.Users;

namespace WorkoutLogAPI.DTOs.Auth;

public record AuthResponse(string Token, UserDto User);
