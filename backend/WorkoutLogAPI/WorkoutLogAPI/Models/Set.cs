using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WorkoutLogAPI.Models;

[Table("sets")]
public class Set : IAuditableEntity
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("weight")]
    public double? Weight { get; set; }

    [Column("reps")]
    public int? Reps { get; set; }
    
    [Column("target_reps_min")]
    public int? TargetRepsMin { get; set; }
    
    [Column("target_reps_max")]
    public int? TargetRepsMax { get; set; }

    [Column("effort_rating")]
    public double? EffortRating { get; set; }
    
    [Column("target_effort_min")]
    public double? TargetEffortMin { get; set; }

    [Column("target_effort_max")]
    public double? TargetEffortMax { get; set; }

    [Column("exercise_id")]
    public int ExerciseId { get; set; }

    [Column("deleted")]
    public bool Deleted { get; set; } = false;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
    
    // Navigation properties
    [ForeignKey(nameof(ExerciseId))]
    public WorkoutExercise Exercise { get; set; } = null!;
}
