using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkoutLogAPI.DTOs.Exercises;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;

namespace WorkoutLogAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/exercises")]
public class ExerciseController : ControllerBase
{
    private readonly ExerciseService _exerciseService;
    private readonly ILogger<ExerciseController> _logger;

    public ExerciseController(ExerciseService exerciseService, ILogger<ExerciseController> logger)
    {
        _exerciseService = exerciseService;
        _logger = logger;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<ExerciseDto>>> GetExercises()
    {
        try
        {
            // Get userId from JWT token
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { error = "User not authenticated" });
            }
            
            List<Exercise> exercises = await _exerciseService.GetExercisesAsync(userId);
            List<ExerciseDto> exerciseDtos = exercises.Select(e => new ExerciseDto(e)).ToList();
            
            _logger.LogInformation("Retrieved {Count} exercises for user {UserId}", exerciseDtos.Count, userId);
            
            return Ok(exerciseDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving exercises");
            return StatusCode(500, new { error = "An error occurred while retrieving exercises" });
        }
    }
}