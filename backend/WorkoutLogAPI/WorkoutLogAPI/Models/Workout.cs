namespace WorkoutLogAPI.Models;

public class Workout : IHasTimestamps
{
    public string Id { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Notes { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public string UserId { get; set; } = null!;
    public bool Deleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<WorkoutExercise> Exercises { get; set; } = new List<WorkoutExercise>();
}
