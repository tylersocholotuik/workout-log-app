using WorkoutLogAPI.Data;
using WorkoutLogAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace WorkoutLogAPI.Services;

public class UserService
{
    private readonly WorkoutDbContext _dbContext;
    private readonly ILogger<UserService> _logger;

    public UserService(WorkoutDbContext dbContext, ILogger<UserService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }
    
    public async Task<User> GetUserByEmailAsync(string email)
    {
        User? user;
        try
        {
            user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by email: {Message}", ex.Message);
            throw;
        }

        if (user == null)
        {
            // A missing user is an expected outcome for callers like the
            // forgot-password flow, not a failure - log it separately so it
            // isn't reported (or double-logged) as an error.
            _logger.LogWarning("User with email {Email} not found.", email);
            throw new KeyNotFoundException("A user with this email was not found.");
        }

        return user;
    }
}