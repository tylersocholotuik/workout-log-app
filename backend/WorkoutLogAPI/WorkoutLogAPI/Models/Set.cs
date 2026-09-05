namespace WorkoutLogAPI.Models;

public class Set : IHasTimestamps
{
    public int Id { get; init; }
    public double? Weight { get; init; }
    public int? Reps { get; init; }
    public double? Rpe { get; init; }
    public int ExerciseId { get; init; }
    public bool Deleted { get; init; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public WorkoutExercise Exercise { get; init; } = null!;
}
