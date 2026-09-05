using WorkoutLogAPI.Models;
using WorkoutLogAPI.DTOs;

namespace WorkoutLogAPI.DTOs;

public record WorkoutDto(
    string? Id,
    string Title,
    string UserId,
    DateTime Date,
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