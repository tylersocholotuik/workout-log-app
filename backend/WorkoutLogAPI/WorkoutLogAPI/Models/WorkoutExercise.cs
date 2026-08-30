namespace WorkoutLogAPI.Models;

public class WorkoutExercise
{
    public int Id { get; set; }
    public string? Notes { get; set; }
    public string WeightUnit { get; set; } = null!;
    public int? ExerciseId { get; set; }
    public int? UserExerciseId { get; set; }
    public string WorkoutId { get; set; } = null!;
    public bool Deleted { get; set; } = false;
    
    // Navigation properties
    public Exercise? Exercise { get; set; }
    public UserExercise? UserExercise { get; set; }
    public Workout Workout { get; set; } = null!;
    public ICollection<Set> Sets { get; set; } = new List<Set>();
}
