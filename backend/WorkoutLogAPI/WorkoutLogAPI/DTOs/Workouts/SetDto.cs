using WorkoutLogAPI.Models;
using WorkoutLogAPI.Validation;

namespace WorkoutLogAPI.DTOs.Workouts;

public record SetDto(
    int? Id,
    [param: WeightRange] double? Weight,
    [param: RepsRange] int? Reps,
    // Range/step validation depends on the parent WorkoutExerciseDto's
    // EffortType (RPE vs RIR), so it's enforced in
    // WorkoutExerciseDto.Validate instead of an attribute here.
    double? EffortRating,
    int ExerciseId,
    [param: RepsRange] int? TargetRepsMin = null,
    [param: RepsRange] int? TargetRepsMax = null,
    double? TargetEffortMin = null,
    double? TargetEffortMax = null)
{
    public static SetDto FromSet(Set set) =>
        new(set.Id, set.Weight, set.Reps, set.EffortRating, set.ExerciseId, set.TargetRepsMin, set.TargetRepsMax,
            set.TargetEffortMin, set.TargetEffortMax);
}