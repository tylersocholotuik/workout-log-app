using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WorkoutLogAPI.Enums;

namespace WorkoutLogAPI.Models;

[Table("workout_exercises")]
public class WorkoutExercise : IAuditableEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("weight_unit")]
    public WeightUnit WeightUnit { get; set; }

    [Column("exercise_id")]
    public int ExerciseId { get; set; }

    [Column("workout_id")]
    public string WorkoutId { get; set; } = null!;

    [Column("deleted")]
    public bool Deleted { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    [ForeignKey(nameof(ExerciseId))]
    public Exercise Exercise { get; set; } = null!;

    [ForeignKey(nameof(WorkoutId))]
    public Workout Workout { get; set; } = null!;
    public ICollection<Set> Sets { get; set; } = new List<Set>();
}
