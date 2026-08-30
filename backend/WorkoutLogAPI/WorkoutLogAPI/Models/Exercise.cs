namespace WorkoutLogAPI.Models;

public class Exercise
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    
    // Navigation properties
    public ICollection<WorkoutExercise> WorkoutExercises { get; set; } = new List<WorkoutExercise>();
}
