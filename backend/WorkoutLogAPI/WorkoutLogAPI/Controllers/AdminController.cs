using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkoutLogAPI.DTOs.Admin;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;

namespace WorkoutLogAPI.Controllers;

[Authorize(Policy = "AdminOnly")]
[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly WorkoutService _workoutService;
    private readonly UserService _userService;
    private readonly ILogger<AdminController> _logger;
    private readonly IConfiguration _configuration;
    
    public AdminController (WorkoutService workoutService, UserService userService, ILogger<AdminController> logger, IConfiguration configuration)
    {
        _workoutService = workoutService;
        _userService = userService;
        _logger = logger;
        _configuration = configuration;
    }
    
    [HttpDelete("workouts")]
    // Used to clean up Playwright test user workouts.
    public async Task<IActionResult> HardDeleteTestWorkouts([FromBody] HardDeleteTestWorkoutsRequest request)
    {
        // This endpoint is only enabled in development and staging environments to prevent accidental deletion of user data in production.
        var isEndpointEnabled = _configuration.GetValue<bool>("AdminEndpoints:HardDeleteTestWorkoutsEnabled");
        
        if (!isEndpointEnabled)
        {
            return NotFound();
        }
        
        User user;
        try
        {
            user = await _userService.GetUserByEmailAsync(request.email);
        }
        catch (KeyNotFoundException e)
        {
            _logger.LogWarning("User with email {Email} not found: {Message}", request.email, e.Message);
            return NotFound("User not found");
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error retrieving user by email {Email}: {Message}", request.email, e.Message);
            return StatusCode(500, new { error = "An error occurred while retrieving the user" });
        }

        try
        {
            await _workoutService.HardDeleteUserWorkouts(user.Id);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error hard deleting workouts for user {UserId}: {Message}", user.Id, e.Message);
            return StatusCode(500, new { error = "An error occurred while deleting the workouts" });
        }
        
        return NoContent();
    }
}