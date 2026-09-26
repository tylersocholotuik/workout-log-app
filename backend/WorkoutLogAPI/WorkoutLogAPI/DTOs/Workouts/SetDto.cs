using WorkoutLogAPI.Models;
using WorkoutLogAPI.Validation;

namespace WorkoutLogAPI.DTOs.Workouts;

public record SetDto(
    int? Id,
    [param: WeightRange]
    double? Weight,
    [param: RepsRange]
    int? Reps,
    [param: RpeRange]
    double? Rpe,
    int ExerciseId)
{
    public static SetDto FromSet(Set set) =>
        new(set.Id, set.Weight, set.Reps, set.Rpe, set.ExerciseId);
}