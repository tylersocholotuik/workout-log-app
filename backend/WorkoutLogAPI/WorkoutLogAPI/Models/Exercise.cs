using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace WorkoutLogAPI.Models;

[Table("exercises")]
[Index(nameof(Name))]
public class Exercise : IAuditableEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("user_id")]
    public string? UserId { get; set; }  // null = system exercise, otherwise = user's custom exercise

    [Column("deleted")]
    public bool Deleted { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
    public ICollection<WorkoutExercise> WorkoutExercises { get; init; } = new List<WorkoutExercise>();
}
