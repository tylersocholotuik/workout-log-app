using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Auth;
using WorkoutLogAPI.DTOs.Users;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;

namespace WorkoutLogAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly WorkoutDbContext _context;
    private readonly JwtService _jwtService;
    private readonly AuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(WorkoutDbContext context, JwtService jwtService, AuthService authService, ILogger<AuthController> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { error = "A user with this email already exists" });
            }
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                DisplayName = request.DisplayName,
                PasswordHash = passwordHash,
                FailedLoginAttempts = 0,
                IsLocked = false,
                IsAdmin = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User registered successfully: {Email}", user.Email);
            
            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponse(token, UserDto.FromUser(user)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration");
            return StatusCode(500, new { error = "An error occurred during registration" });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                return Unauthorized(new { error = "Invalid email or password" });
            }
            
            if (user.IsLocked)
            {
                return Unauthorized(new { error = "Account is locked. Please contact support." });
            }
            
            var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                user.FailedLoginAttempts++;
                if (user.FailedLoginAttempts >= 5)
                {
                    user.IsLocked = true;
                    _logger.LogWarning("Account locked due to too many failed login attempts: {Email}", user.Email);
                }
                await _context.SaveChangesAsync();

                return Unauthorized(new { error = "Invalid email or password" });
            }
            
            user.FailedLoginAttempts = 0;
            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("User logged in successfully: {Email}", user.Email);
            
            var token = _jwtService.GenerateToken(user);

            return Ok(new AuthResponse(token, UserDto.FromUser(user)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user login");
            return StatusCode(500, new { error = "An error occurred during login" });
        }
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        try
        {
            var authHeader = Request.Headers.Authorization.ToString();
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader["Bearer ".Length..].Trim()
                : null;

            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { error = "No token provided" });
            }

            var revoked = await _jwtService.RevokeTokenAsync(token);
            if (!revoked)
            {
                return BadRequest(new { error = "Invalid token" });
            }

            _logger.LogInformation("User logged out successfully: {UserId}", User.FindFirst("sub")?.Value);

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during logout");
            return StatusCode(500, new { error = "An error occurred during logout" });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            await _authService.GenerateAndSendPasswordResetTokenAsync(request.Email);
            return Ok(new { message = "Password reset email sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending password reset email: {Message}", ex.Message);
            return StatusCode(500, new { error = "An error occurred while sending the password reset email." });
        }
    }
    
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await _authService.ResetPasswordAsync(request.NewPassword, request.Token);
            return Ok(new { message = "Password has been reset successfully" });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid or expired password reset token: {Message}", ex.Message);
            return BadRequest(new { error = "Invalid or expired password reset token." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password: {Message}", ex.Message);
            return StatusCode(500, new { error = "An error occurred while resetting the password." });
        }
    }
}
