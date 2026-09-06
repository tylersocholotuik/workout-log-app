using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.DTOs.Users;

public record UserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string? DisplayName,
    bool IsAdmin)
{
    public static UserDto FromUser(User user) =>
        new(user.Id, user.Email, user.FirstName, user.LastName, user.DisplayName, user.IsAdmin);
}
