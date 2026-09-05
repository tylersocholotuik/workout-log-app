namespace WorkoutLogAPI.Models;

public class Workout : IHasTimestamps
{
    public string Id { get; init; } = null!;
    public string Title { get; init; } = null!;
    public string? Notes { get; init; }
    public DateTime Date { get; init; } = DateTime.UtcNow;
    public string UserId { get; init; } = null!;
    public bool Deleted { get; init; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public User User { get; init; } = null!;
    public ICollection<WorkoutExercise> Exercises { get; init; } = new List<WorkoutExercise>();
}
