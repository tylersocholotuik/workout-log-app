using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Users;
using WorkoutLogAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace WorkoutLogAPI.Services;

public class UserService
{
    private readonly WorkoutDbContext _context;
    private readonly EmailService _emailService;
    private readonly ILogger<UserService> _logger;

    public UserService(WorkoutDbContext context, EmailService emailService, ILogger<UserService> logger)
    {
        _context = context;
        _emailService = emailService;
        _logger = logger;
    }
    
    public async Task<User> GetUserByEmailAsync(string email)
    {
        User? user;
        try
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
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
            user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
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

    public async Task<User> UpdateUserAsync(string userId, PatchUserDto dto)
    {
        try
        {
            var user = await GetUserByIdAsync(userId);

            // Update only the properties that are provided in the DTO
            if (dto.Email is { } email)
            {
                var emailExists = await _context.Users.AnyAsync(u => u.Email == email && u.Id != userId);

                if (emailExists)
                {
                    throw new InvalidOperationException("A user with this email already exists");
                }
                
                // Capture the original email before any changes for potential email change confirmation
                var originalEmail = user.Email;
                
                if (email != originalEmail)
                {
                    user.Email = email;
                    user.IsEmailVerified = false;
                    
                    // Send a confirmation email about the email change
                    try
                    {
                        var userFullName = $"{user.FirstName} {user.LastName}";
                        await _emailService.SendEmailChangeConfirmationAsync(originalEmail, email, userFullName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error sending email change confirmation to original email {OriginalEmail}: {Message}", originalEmail, ex.Message);
                        // Do not throw an exception here to avoid interrupting the update process
                    }
                }
            }

            if (dto.FirstName is { } firstName) user.FirstName = firstName;
            if (dto.LastName is { } lastName) user.LastName = lastName;
            if (dto.DisplayName is { } displayName) user.DisplayName = displayName;

            await _context.SaveChangesAsync();
            return user;
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while updating user with ID {UserId}: {Message}", userId, ex.Message);
            throw;
        }
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
        
            _context.Users.Update(user);
            await _context.SaveChangesAsync();   
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating password for user ID {UserId}: {Message}", userId, ex.Message);
            throw;
        }
    }
    
    // Separate method for an authenticated user to change their password, which includes verifying the current password.
    // This is different from UpdatePasswordAsync, which is used for password resets and does not require the current password.
    // Failed login attempts and account lockout do not apply here, as the user is already authenticated.
    public async Task ChangePasswordAsync(string userId, string currentPassword, string newPassword)
    {
        try
        {
            var user = await GetUserByIdAsync(userId);

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
            {
                throw new InvalidOperationException("Current password is incorrect");
            }

            var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.PasswordHash = newPasswordHash;
            user.PasswordChangedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
            // Send a confirmation email about the password change
            // Do not throw an exception if the email fails to send so that the password change process is not interrupted.
            try
            {
                var userFullName = $"{user.FirstName} {user.LastName}";
                await _emailService.SendPasswordChangeConfirmationEmailAsync(user.Email, userFullName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending password change confirmation email to user ID {UserId}: {Message}", userId, ex.Message);
            }
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while changing password for user ID {UserId}: {Message}", userId, ex.Message);
            throw;
        }
    }
}