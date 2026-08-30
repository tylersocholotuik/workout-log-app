namespace WorkoutLogAPI.Models;

public class UserExercise
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string UserId { get; set; } = null!;
    public bool Deleted { get; set; } = false;
    
    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = new List<WorkoutExercise>();
}
