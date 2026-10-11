using WorkoutLogAPI.Models;
using WorkoutLogAPI.Validation;

namespace WorkoutLogAPI.DTOs.Workouts;

public record SetDto(
    int? Id,
    [param: WeightRange]
    double? Weight,
    [param: RepsRange]
    int? Reps,
    [param: EffortRatingRange]
    double? EffortRating,
    int ExerciseId)
{
    public static SetDto FromSet(Set set) =>
        new(set.Id, set.Weight, set.Reps, set.EffortRating, set.ExerciseId);
}