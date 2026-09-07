using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace WorkoutLogAPI.Models;

[Table("users")]
[Index(nameof(Email), IsUnique = true)]
public class User : IAuditableEntity
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = null!;

    [Column("email")]
    public string Email { get; set; } = null!;

    [Column("first_name")]
    public string FirstName { get; set; } = null!;

    [Column("last_name")]
    public string LastName { get; set; } = null!;

    [Column("display_name")]
    public string? DisplayName { get; set; } = null;

    [Column("password_hash")]
    public string PasswordHash { get; set; } = null!;

    [Column("failed_login_attempts")]
    public int FailedLoginAttempts { get; set; } = 0;

    [Column("is_locked")]
    public bool IsLocked { get; set; } = false;
    
    [Column("password_changed_at")]
    public DateTime PasswordChangedAt { get; set; }
    
    [Column("is_email_verified")]
    public bool IsEmailVerified { get; set; } = false;

    [Column("is_admin")]
    public bool IsAdmin { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = null;

    [Column("last_login_at")]
    public DateTime? LastLoginAt { get; set; } = null;
    
    // Navigation properties
    public ICollection<Workout> Workouts { get; set; } = new List<Workout>();
    public ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
}
