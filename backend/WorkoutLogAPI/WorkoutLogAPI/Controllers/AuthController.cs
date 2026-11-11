using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkoutLogAPI.Constants;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Auth;
using WorkoutLogAPI.DTOs.Users;
using WorkoutLogAPI.Extensions;
using WorkoutLogAPI.Services;

namespace WorkoutLogAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly WorkoutDbContext _context;
    private readonly JwtService _jwtService;
    private readonly AuthService _authService;
    private readonly UserService _userService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        WorkoutDbContext context, 
        JwtService jwtService, 
        AuthService authService, 
        UserService userService, 
        ILogger<AuthController> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _authService = authService;
        _userService = userService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var user = await _authService.CreateUserAsync(
                request.Email, request.FirstName, request.LastName, request.DisplayName, request.Password);

            _logger.LogInformation("User registered successfully: {Email}", user.Email);
            
            var token = _jwtService.GenerateToken(user);

            Response.Cookies.Append(AppConstants.Auth.TokenCookieName, token, _jwtService.BuildAuthCookieOptions());

            return Ok(new AuthResponse(UserDto.FromUser(user)));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration failed: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
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
            var user = await _authService.AuthenticateUserAsync(request.Email, request.Password);

            _logger.LogInformation("User logged in successfully: {Email}", user.Email);
            
            var token = _jwtService.GenerateToken(user);

            Response.Cookies.Append(AppConstants.Auth.TokenCookieName, token, _jwtService.BuildAuthCookieOptions());

            return Ok(new AuthResponse(UserDto.FromUser(user)));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Login failed: {Message}", ex.Message);
            return Unauthorized(new { error = ex.Message });
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
            string? token = Request.Cookies[AppConstants.Auth.TokenCookieName];

            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { error = "No token provided" });
            }

            var revoked = await _jwtService.RevokeTokenAsync(token);
            if (!revoked)
            {
                return BadRequest(new { error = "Invalid token" });
            }

            Response.Cookies.Delete(AppConstants.Auth.TokenCookieName);
            
            _logger.LogInformation("User logged out successfully: {UserId}", this.GetUserId());

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

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = this.GetUserId();
            await _userService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
            return Ok(new { message = "Password changed successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "User not found: {Message}", ex.Message);
            return NotFound(new { error = "User not found." });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while changing password: {Message}", ex.Message);
            return StatusCode(500, new { error = "An unexpected error occurred while changing the password." });
        }
    }
}
