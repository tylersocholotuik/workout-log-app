namespace WorkoutLogAPI.Models;

public class Exercise : IHasTimestamps
{
    public int Id { get; init; }
    public string Name { get; init; } = null!;
    public string? UserId { get; init; }  // null = system exercise, otherwise = user's custom exercise
    public bool Deleted { get; init; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public User? User { get; init; }
    public ICollection<WorkoutExercise> WorkoutExercises { get; init; } = new List<WorkoutExercise>();
}
