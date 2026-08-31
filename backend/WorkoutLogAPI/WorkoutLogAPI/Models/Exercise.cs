namespace WorkoutLogAPI.Models;

public class Exercise : IHasTimestamps
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string? UserId { get; set; }  // null = system exercise, otherwise = user's custom exercise
    public bool Deleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    public User? User { get; set; }
    public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = new List<WorkoutExercise>();
}
