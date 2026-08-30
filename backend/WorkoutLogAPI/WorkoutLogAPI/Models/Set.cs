namespace WorkoutLogAPI.Models;

public class Set
{
    public int Id { get; set; }
    public double? Weight { get; set; }
    public int? Reps { get; set; }
    public double? Rpe { get; set; }
    public int ExerciseId { get; set; }
    public bool Deleted { get; set; } = false;
    
    // Navigation properties
    public WorkoutExercise Exercise { get; set; } = null!;
}
