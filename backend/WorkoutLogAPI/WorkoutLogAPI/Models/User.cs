namespace WorkoutLogAPI.Models;

public class User : IHasTimestamps
{
    public string Id { get; init; } = null!;
    public string Email { get; init; } = null!;
    public string FirstName { get; init; } = null!;
    public string LastName { get; init; } = null!;
    public string? DisplayName { get; init; } = null;
    public string PasswordHash { get; init; } = null!;
    public int FailedLoginAttempts { get; set; } = 0;
    public bool IsLocked { get; set; } = false;
    public bool IsAdmin { get; init; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; } = null;
    public DateTime? LastLoginAt { get; set; } = null;
    
    // Navigation properties
    public ICollection<Workout> Workouts { get; init; } = new List<Workout>();
    public ICollection<Exercise> Exercises { get; init; } = new List<Exercise>();
}
