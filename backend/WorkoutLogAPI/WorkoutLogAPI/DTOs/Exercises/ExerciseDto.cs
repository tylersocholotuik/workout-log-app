using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.DTOs.Exercises;

public record ExerciseDto(int? Id, string Name, string? UserId)
{
    public static ExerciseDto FromExercise(Exercise exercise) =>
        new(exercise.Id, exercise.Name, exercise.UserId);
}