using WorkoutLogAPI.Models;
using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Workouts;

public record WorkoutDto(
    string? Id,
    [param: Required(ErrorMessage = "Title is required")]
    [param: StringLength(50, ErrorMessage = "Title must be less than 50 characters")]
    string Title,
    string? UserId,
    DateTime Date,
    [param: StringLength(250, ErrorMessage = "Notes must be less than 250 characters")]
    string? Notes,
    List<WorkoutExerciseDto>? Exercises )
{
    public static WorkoutDto FromWorkout(Workout workout) =>
        new(
            workout.Id,
            workout.Title,
            workout.UserId,
            workout.Date,
            workout.Notes,
            workout.Exercises
                .Select(WorkoutExerciseDto.FromWorkoutExercise)
                .ToList());
}