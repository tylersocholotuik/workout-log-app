using WorkoutLogAPI.Constants;
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
                Email = AppConstants.SeedData.TestUserEmail,
                FirstName = AppConstants.SeedData.TestUserFirstName,
                LastName = AppConstants.SeedData.TestUserLastName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(AppConstants.SeedData.TestUserPassword),
            }
        };
    }
}