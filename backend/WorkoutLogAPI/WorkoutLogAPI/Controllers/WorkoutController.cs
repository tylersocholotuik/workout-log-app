using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.DTOs.Workouts;
using WorkoutLogAPI.Extensions;
using WorkoutLogAPI.Exceptions;

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
    
    #region GetUserWorkouts
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
    #endregion
    
    #region GetActiveWorkout
    [HttpGet("active")]
    public async Task<ActionResult<WorkoutDto>> GetActiveWorkout()
    {
        try
        {
            string userId = this.GetUserId();
            
            var workout = await _workoutService.GetActiveWorkout(userId);

            if (workout == null)
            {
                return NoContent();
            }
            
            return Ok(WorkoutDto.FromWorkout(workout));
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error retrieving active workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while retrieving the active workout" });
        }
    }
    #endregion
    
    #region GetWorkoutById
    [HttpGet("{id}")]
    public async Task<ActionResult<WorkoutDto>> GetWorkoutById(string id)
    {
        try
        {
            string userId = this.GetUserId();
            var workout = await _workoutService.GetWorkoutById(id, userId);
            return Ok(WorkoutDto.FromWorkout(workout));
        }
        catch (KeyNotFoundException e)
        {
            _logger.LogWarning(e, "Workout not found: {Message}", e.Message);
            return NotFound(new { error = "Workout not found" });
        }
        catch (UnauthorizedAccessException e)
        {
            _logger.LogWarning(e, "Unauthorized access to workout: {Message}", e.Message);
            // Use StatusCode with a JSON body rather than Forbid(), since Forbid()
            // returns an empty response body and the frontend expects a JSON
            // error payload it can parse.
            return StatusCode(403, new { error = "You do not have access to this workout" });
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error retrieving workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while retrieving the workout" });
        }
    }
    #endregion
    
    #region GetExerciseHistory
    [HttpGet("exercise-history/{exerciseId}")]
    public async Task<ActionResult<List<ExerciseHistoryDto>>> GetExerciseHistory(int exerciseId)
    {
        try
        {
            string userId = this.GetUserId();
            var history = await _workoutService.GetExerciseHistory(exerciseId, userId);
            return Ok(history.Select(ExerciseHistoryDto.FromWorkoutExercise).ToList());
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error retrieving exercise history: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while retrieving exercise history" });
        }
    }
    #endregion
    
    #region CreateWorkout
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
        catch (ActiveWorkoutExistsException e)
        {
            _logger.LogWarning(e, "Active workout already exists: {Message}", e.Message);
            return Conflict(new { error = e.Message });
        }
        catch (DuplicateWorkoutException e)
        {
            _logger.LogWarning(e, "Workout already exists: {Message}", e.Message);
            return Conflict(new { error = e.Message });
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error creating workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while creating the workout" });
        }
    }
    #endregion
    
    #region UpdateWorkout
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
        catch (DuplicateWorkoutException e)
        {
            _logger.LogWarning(e, "Workout already exists: {Message}", e.Message);
            return Conflict(new { error = e.Message });
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error updating workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while updating the workout" });
        }
    }
    #endregion

    #region FinishWorkout
    [HttpPatch("{id}/finish")]
    public async Task<ActionResult> FinishWorkout(string id)
    {
        try
        {
            string userId = this.GetUserId();

            await _workoutService.FinishWorkout(id, userId);

            _logger.LogInformation("Workout finished successfully with ID {WorkoutId} for user {UserId}", id, userId);

            return Ok();
        }
        catch (KeyNotFoundException e)
        {
            _logger.LogWarning(e, "Workout not found: {Message}", e.Message);
            return NotFound(new { error = "Workout not found" });
        }
        catch (InvalidOperationException e)
        {
            _logger.LogWarning(e, "Workout already finished: {Message}", e.Message);
            return Conflict(new { error = "Workout is already finished" });
        }
        catch (UnauthorizedAccessException e)
        {
            _logger.LogWarning(e, "Unauthorized access to finish workout: {Message}", e.Message);
            return StatusCode(403, new { error = "You do not have access to this workout" });
        }
        catch (Exception e)
        {
            _logger.LogError(e, "Error finishing workout: {Message}", e.Message);
            return StatusCode(500, new { error = "An error occurred while finishing the workout" });
        }
    }
    #endregion

    #region DeleteWorkout
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
    #endregion
}