using WorkoutLogAPI.Models;
using WorkoutLogAPI.Enums;

namespace WorkoutLogAPI.DTOs.Workouts;

public record ExerciseHistoryDto(
    string? Notes,
    WeightUnit WeightUnit,
    ExerciseHistoryWorkoutDto Workout,
    List<SetDto> Sets)
{
    public static ExerciseHistoryDto FromWorkoutExercise(WorkoutExercise workoutExercise) =>
        new(
            workoutExercise.Notes,
            workoutExercise.WeightUnit,
            new ExerciseHistoryWorkoutDto(workoutExercise.Workout.Date),
            workoutExercise.Sets
                .Select(SetDto.FromSet)
                .ToList());
}

// Required to view the workout date in the exercise history modal
public record ExerciseHistoryWorkoutDto(DateTime Date);

