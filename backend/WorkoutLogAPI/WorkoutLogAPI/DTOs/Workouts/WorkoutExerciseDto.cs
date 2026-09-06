using WorkoutLogAPI.Models;
using WorkoutLogAPI.DTOs.Exercises;
using WorkoutLogAPI.Enums;
using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Workouts;

public record WorkoutExerciseDto(
    int? Id,
    [param: StringLength(100, ErrorMessage = "Notes must be less than 100 characters")]
    string? Notes,
    WeightUnit WeightUnit,
    int ExerciseId,
    string WorkoutId,
    ExerciseDto Exercise,
    List<SetDto>? Sets = null)
{
    public static WorkoutExerciseDto FromWorkoutExercise(WorkoutExercise workoutExercise) =>
        new(
            workoutExercise.Id,
            workoutExercise.Notes,
            workoutExercise.WeightUnit,
            workoutExercise.ExerciseId,
            workoutExercise.WorkoutId,
            ExerciseDto.FromExercise(workoutExercise.Exercise),
            workoutExercise.Sets
                .Select(SetDto.FromSet)
                .ToList());
}