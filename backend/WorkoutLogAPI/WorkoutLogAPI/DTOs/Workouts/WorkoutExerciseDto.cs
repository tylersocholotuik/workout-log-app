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
    EffortRatingType EffortType,
    int ExerciseId,
    string? WorkoutId,
    ExerciseDto? Exercise,
    List<SetDto>? Sets = null) : IValidatableObject
{
    public static WorkoutExerciseDto FromWorkoutExercise(WorkoutExercise workoutExercise) =>
        new(
            workoutExercise.Id,
            workoutExercise.Notes,
            workoutExercise.WeightUnit,
            workoutExercise.EffortType,
            workoutExercise.ExerciseId,
            workoutExercise.WorkoutId,
            ExerciseDto.FromExercise(workoutExercise.Exercise),
            workoutExercise.Sets
                .Select(SetDto.FromSet)
                .ToList());

    private const double MinEffortRating = 0;
    private const double MaxEffortRating = 10;

    // Range and step validation for each set's EffortRating depends on this
    // DTO's EffortType (RPE allows 0.5 steps; RIR must be a whole number), so
    // it's validated here rather than via an attribute on SetDto.
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Sets is null)
        {
            yield break;
        }

        for (var i = 0; i < Sets.Count; i++)
        {
            var effortRating = Sets[i].EffortRating;

            if (effortRating is null)
            {
                continue;
            }

            var value = effortRating.Value;

            if (value < MinEffortRating || value > MaxEffortRating)
            {
                yield return new ValidationResult(
                    $"Effort rating must be between {MinEffortRating} and {MaxEffortRating}",
                    [$"{nameof(Sets)}[{i}].{nameof(SetDto.EffortRating)}"]);
                continue;
            }

            if (EffortType == EffortRatingType.Rir)
            {
                if (value % 1 != 0)
                {
                    yield return new ValidationResult(
                        "RIR must be a whole number",
                        [$"{nameof(Sets)}[{i}].{nameof(SetDto.EffortRating)}"]);
                }
            }
            else
            {
                // multiplying by 2 turns the 0.5 step requirement into a whole
                // number check, avoiding floating point precision issues from
                // using % 0.5
                var doubled = value * 2;

                if (Math.Abs(doubled - Math.Round(doubled)) >= 0.0001)
                {
                    yield return new ValidationResult(
                        "RPE must be in steps of 0.5",
                        [$"{nameof(Sets)}[{i}].{nameof(SetDto.EffortRating)}"]);
                }
            }
        }
    }
}