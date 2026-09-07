using WorkoutLogAPI.Models;
using WorkoutLogAPI.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Constants;

namespace WorkoutLogAPI.Services;

public class AuthService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly WorkoutDbContext _context;
    private readonly EmailService _emailService;
    private readonly UserService _userService;
    
    public AuthService(IConfiguration configuration, ILogger<AuthService> logger, WorkoutDbContext context, EmailService emailService, UserService userService)
    {
        _configuration = configuration;
        _logger = logger;
        _context = context;
        _emailService = emailService;
        _userService = userService;
    }
    
    public async Task GenerateAndSendPasswordResetTokenAsync(string email)
    {
        User user;
        try
        {
            user = await _userService.GetUserByEmailAsync(email);
        }
        catch (KeyNotFoundException)
        {
            // Don't throw an error message here to avoid revealing whether the email is registered or not.
            _logger.LogInformation("Password reset requested for an unregistered email");
            return;
        }

        try
        {
            var userFullName = $"{user.FirstName} {user.LastName}";
            
            // Remove all existing password reset tokens for this user to ensure only one valid token exists at a time
            var existingTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.Id)
                .ToListAsync();

            if (existingTokens.Count > 0)
            {
                _context.PasswordResetTokens.RemoveRange(existingTokens);
            }
            
            // Generate a secure random token
            var resetToken = GenerateSecureToken();
            
            // Hash the token before storing it in the database
            var resetTokenHash = HashToken(resetToken);
            
            // Get the token expiration time from configuration (default to 15 minutes if not set)
            var expirationMinutes = _configuration.GetValue("PasswordReset:TokenExpirationInMinutes", 15);
            
            var passwordResetToken = new PasswordResetToken
            {
                UserId = user.Id,
                TokenHash = resetTokenHash,
                ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes)
            };
            
            _context.PasswordResetTokens.Add(passwordResetToken);
            await _context.SaveChangesAsync();
            
            // Send the password reset email
            await SendPasswordResetEmailAsync(email, userFullName, resetToken, expirationMinutes);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating or sending password reset token for {Email}: {Message}", email, ex.Message);
            throw;
        }
    }
    
    private static string GenerateSecureToken(int length = 32)
    {
        // Generate a secure random token of the specified length (default is 32 bytes)
        var tokenBytes = new byte[length];
        
        // Use a cryptographically secure random number generator
        RandomNumberGenerator.Fill(tokenBytes);
        
        // Convert the byte array to a URL-safe Base64 string
        return WebEncoders.Base64UrlEncode(tokenBytes);
    }

    public static string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(tokenBytes);
        
        return Convert.ToHexString(hashBytes);
    }
    
    private async Task SendPasswordResetEmailAsync(string email, string toName, string resetToken, int expirationMinutes)
    {
        try
        {
            var baseUrl = _configuration.GetValue<string>("Frontend:BaseUrl");
            var resetUrl = $"{baseUrl}/reset-password?token={resetToken}";
            var subject = AppConstants.EmailSubjects.PasswordReset;
            var body = $"""
                <p>Hi {toName},</p>
                <p>We received a request to reset the password for your Workout Log account. Click the button below to choose a new one:</p>
                <p>
                    <a href="{resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#0d6efd;color:#ffffff;text-decoration:none;border-radius:4px;">
                        Reset Password
                    </a>
                </p>
                <p>This link will expire in {expirationMinutes} minutes and can only be used once.</p>
                <p>If you didn't request a password reset, you can safely ignore this email &mdash; your password will not be changed.</p>
                """;
            
            await _emailService.SendEmailAsync(email, subject, toName, body);
            _logger.LogInformation("Password reset email sent to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending password reset email to {Email}: {Message}", email, ex.Message);
            throw;
        }
    }
}