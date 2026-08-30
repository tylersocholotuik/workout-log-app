namespace WorkoutLogAPI.Models;

public class Workout
{
    public string Id { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Notes { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string UserId { get; set; } = null!;
    public bool Deleted { get; set; } = false;
    
    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<WorkoutExercise> Exercises { get; set; } = new List<WorkoutExercise>();
}
