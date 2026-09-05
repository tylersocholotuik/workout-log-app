using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.DTOs;

public record SetDto
(
    int? Id,
    double? Weight,
    int? Reps,
    double? Rpe,
    int ExerciseId)
{
    public static SetDto FromSet(Set set) =>
        new(set.Id, set.Weight, set.Reps, set.Rpe, set.ExerciseId);
}