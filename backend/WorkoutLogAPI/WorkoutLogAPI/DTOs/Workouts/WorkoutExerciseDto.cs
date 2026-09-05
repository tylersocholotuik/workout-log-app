using WorkoutLogAPI.Models;
using WorkoutLogAPI.DTOs.Exercises;

namespace WorkoutLogAPI.DTOs;

public record WorkoutExerciseDto(
    int? Id,
    string? Notes,
    string WeightUnit,
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