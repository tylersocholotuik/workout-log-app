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

    // Range and step validation for each effort-rating-like field depends on
    // this DTO's EffortType (RPE allows 0.5 steps; RIR must be a whole
    // number), so it's validated here rather than via an attribute on
    // SetDto. EffortRating, TargetEffortMin, and TargetEffortMax all share
    // the same rules, so they're validated through this one helper.
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Sets is null)
        {
            yield break;
        }

        for (var i = 0; i < Sets.Count; i++)
        {
            var set = Sets[i];

            foreach (var result in ValidateEffortField(set.EffortRating, nameof(SetDto.EffortRating), i))
            {
                yield return result;
            }

            foreach (var result in ValidateEffortField(set.TargetEffortMin, nameof(SetDto.TargetEffortMin), i))
            {
                yield return result;
            }

            foreach (var result in ValidateEffortField(set.TargetEffortMax, nameof(SetDto.TargetEffortMax), i))
            {
                yield return result;
            }

            if (set.TargetEffortMin is not null && set.TargetEffortMax is not null &&
                set.TargetEffortMin > set.TargetEffortMax)
            {
                yield return new ValidationResult(
                    "Target effort min must not be greater than target effort max",
                    [$"{nameof(Sets)}[{i}].{nameof(SetDto.TargetEffortMin)}"]);
            }

            if (set.TargetRepsMin is not null && set.TargetRepsMax is not null &&
                set.TargetRepsMin > set.TargetRepsMax)
            {
                yield return new ValidationResult(
                    "Target reps min must not be greater than target reps max",
                    [$"{nameof(Sets)}[{i}].{nameof(SetDto.TargetRepsMin)}"]);
            }
        }
    }

    // Validates a single effort-rating-like value (range + RPE/RIR step
    // rules) and tags any error with the given property name/set index.
    private IEnumerable<ValidationResult> ValidateEffortField(double? value, string propertyName, int setIndex)
    {
        if (value is null)
        {
            yield break;
        }

        var member = $"{nameof(Sets)}[{setIndex}].{propertyName}";

        if (value < MinEffortRating || value > MaxEffortRating)
        {
            yield return new ValidationResult(
                $"Effort rating must be between {MinEffortRating} and {MaxEffortRating}",
                [member]);
            yield break;
        }

        if (EffortType == EffortRatingType.Rir)
        {
            if (value % 1 != 0)
            {
                yield return new ValidationResult("RIR must be a whole number", [member]);
            }
        }
        else
        {
            // multiplying by 2 turns the 0.5 step requirement into a whole
            // number check, avoiding floating point precision issues from
            // using % 0.5
            var doubled = value.Value * 2;

            if (Math.Abs(doubled - Math.Round(doubled)) >= 0.0001)
            {
                yield return new ValidationResult("RPE must be in steps of 0.5", [member]);
            }
        }
    }
}