using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs;
using WorkoutLogAPI.DTOs.Auth;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using BCrypt.Net;

namespace WorkoutLogAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly WorkoutDbContext _context;
    private readonly JwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(WorkoutDbContext context, JwtService jwtService, ILogger<AuthController> logger)
    {
        _context = context;
        _jwtService = jwtService;
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

            return Ok(new AuthResponse
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    DisplayName = user.DisplayName,
                    IsAdmin = user.IsAdmin
                }
            });
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

            return Ok(new AuthResponse
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    DisplayName = user.DisplayName,
                    IsAdmin = user.IsAdmin
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user login");
            return StatusCode(500, new { error = "An error occurred during login" });
        }
    }
}
