using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.DTOs.Exercises;

public record ExerciseDto(int Id, string Name, string? UserId)
{
    public ExerciseDto(Exercise exercise) 
        : this(exercise.Id, exercise.Name, exercise.UserId)
    {
    }
}