namespace WorkoutLogAPI.Models;

public class WorkoutExercise : IHasTimestamps
{
    public int Id { get; init; }
    public string? Notes { get; init; }
    public string WeightUnit { get; init; } = null!;
    public int ExerciseId { get; init; }
    public string WorkoutId { get; init; } = null!;
    public bool Deleted { get; init; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public Exercise Exercise { get; init; } = null!;
    public Workout Workout { get; init; } = null!;
    public ICollection<Set> Sets { get; init; } = new List<Set>();
}
