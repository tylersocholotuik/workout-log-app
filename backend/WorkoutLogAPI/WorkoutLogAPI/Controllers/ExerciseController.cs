using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkoutLogAPI.DTOs.Exercises;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.Extensions;

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
            string? userId = this.GetUserId();
            
            List<Exercise> exercises = await _exerciseService.GetExercises(userId);
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
    
    [HttpGet("{id}")]
    public async Task<ActionResult<ExerciseDto>> GetExerciseById(int id)
    {
        string userId = this.GetUserId();
        
        try
        {
            var exercise = await _exerciseService.GetExerciseById(id, userId);
            return Ok(new ExerciseDto(exercise));
        }
        catch (KeyNotFoundException e)
        {
            return NotFound(new { error = e.Message });
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error retrieving exercise with ID {ExerciseId}", id);
            return StatusCode(500, new { error = "An error occurred while retrieving the exercise" });
        }
    }
    
    [HttpPost]
    public async Task<ActionResult<ExerciseDto>> CreateUserExercise([FromBody] CreateExerciseRequest request)
    {
        string? userId = this.GetUserId();

        try
        {
            var exerciseEntity = await _exerciseService.CreateUserExercise(userId, request.Name);
            
            _logger.LogInformation("Created new exercise with ID {ExerciseId} for user {UserId}", exerciseEntity.Id, userId);
            
            return CreatedAtAction(nameof(GetExerciseById), new { id = exerciseEntity.Id }, new ExerciseDto(exerciseEntity));
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error creating exercise for user {UserId}: {ErrorMessage}", userId, e.Message);
            return StatusCode(500, new { error = $"Error creating exercise for user {userId}: {e.Message}" });
        }
    }
}