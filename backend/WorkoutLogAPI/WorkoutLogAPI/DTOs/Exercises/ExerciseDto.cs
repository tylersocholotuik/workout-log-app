using WorkoutLogAPI.Models;
using WorkoutLogAPI.Enums;
using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Exercises;

public record ExerciseDto(
    int? Id,
    [param: Required(ErrorMessage = "Name is required")]
    [param: StringLength(100, ErrorMessage = "Name must be less than 100 characters")]
    string Name,
    ExerciseType ExerciseType,
    string? UserId)
{
    public static ExerciseDto FromExercise(Exercise exercise) =>
        new(exercise.Id, exercise.Name, exercise.ExerciseType, exercise.UserId);
}