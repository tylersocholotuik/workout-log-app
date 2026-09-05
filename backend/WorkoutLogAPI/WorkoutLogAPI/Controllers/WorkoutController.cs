using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.DTOs;
using WorkoutLogAPI.Extensions;

namespace WorkoutLogAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/workouts")]
public class WorkoutController : ControllerBase
{
    private readonly WorkoutService _workoutService;
    private readonly ILogger<WorkoutController> _logger;
    
    public WorkoutController(WorkoutService workoutService, ILogger<WorkoutController> logger)
    {
        _workoutService = workoutService;
        _logger = logger;
    }
    
    [HttpGet]
    public async Task<ActionResult<List<WorkoutDto>>> GetUserWorkouts()
    {
        try
        {
            string userId = this.GetUserId();
            var workouts = await _workoutService.GetUserWorkouts(userId);
            return Ok(workouts.Select(WorkoutDto.FromWorkout).ToList());
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error retrieving workouts: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while retrieving workouts" });
        }
    }
    
    [HttpGet("{id}")]
    public async Task<ActionResult<WorkoutDto>> GetWorkoutById(string id)
    {
        try
        {
            string userId = this.GetUserId();
            var workout = await _workoutService.GetWorkoutById(id, userId);
            return Ok(WorkoutDto.FromWorkout(workout));
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error retrieving workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while retrieving the workout" });
        }
    }
    
    [HttpPost]
    public async Task<ActionResult<WorkoutDto>> CreateWorkout([FromBody] WorkoutDto workoutDto)
    {
        try
        {
            string userId = this.GetUserId();
            var workout = await _workoutService.CreateWorkout(workoutDto, userId);
            _logger.LogInformation("Workout created successfully with ID {WorkoutId} for user {UserId}", workout.Id, userId);
            return CreatedAtAction(nameof(GetWorkoutById), new { id = workout.Id }, WorkoutDto.FromWorkout(workout));
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error creating workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while creating the workout" });
        }
    }
    
    [HttpPut("{id}")]
    public async Task<ActionResult<WorkoutDto>> UpdateWorkout(string id, [FromBody] WorkoutDto workoutDto)
    {
        try
        {
            string userId = this.GetUserId();
            var workout = await _workoutService.UpdateWorkout(id, workoutDto, userId);
            _logger.LogInformation("Workout updated successfully with ID {WorkoutId} for user {UserId}", workout.Id, userId);
            return Ok(WorkoutDto.FromWorkout(workout));
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error updating workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while updating the workout" });
        }
    }
    
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteWorkout(string id)
    {
        try
        {
            string userId = this.GetUserId();
            await _workoutService.DeleteWorkout(id, userId);
            _logger.LogInformation("Workout deleted successfully with ID {WorkoutId} for user {UserId}", id, userId);
            return NoContent();
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error deleting workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while deleting the workout" });
        }
    }
}