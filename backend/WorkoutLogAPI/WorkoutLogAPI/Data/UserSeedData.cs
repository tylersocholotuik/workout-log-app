using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.Data;

public class UserSeedData
{
    public static List<User> GetSeedUsers()
    {
        return new List<User>
        {
            new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = "workoutlogtestuser@gmail.com",
                FirstName = "Test",
                LastName = "User",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("testuserpassword"),
            }
        };
    }
}