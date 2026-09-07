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
    
    public async Task<User> GetUserByIdAsync(string userId)
    {
        User? user;
        try
        {
            user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user by ID: {Message}", ex.Message);
            throw;
        }

        if (user == null)
        {
            _logger.LogWarning("User with ID {UserId} not found.", userId);
            throw new KeyNotFoundException("A user with this ID was not found.");
        }

        return user;
    }
    
    public async Task UpdatePasswordAsync(string userId, string newPasswordHash)
    {
        try
        {
            var user = await GetUserByIdAsync(userId);

            user.PasswordHash = newPasswordHash;
            user.PasswordChangedAt = DateTime.UtcNow;
            user.FailedLoginAttempts = 0; // Reset failed login attempts on password change
            user.IsLocked = false; // Unlock the account on password change
        
            _dbContext.Users.Update(user);
            await _dbContext.SaveChangesAsync();   
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating password for user ID {UserId}: {Message}", userId, ex.Message);
            throw;
        }
    }
}