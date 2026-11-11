using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Enums;

namespace WorkoutLogAPI.Models;

[Table("user_settings")]
public class UserSettings : IAuditableEntity
{
    [Key]
    [Column("user_id")]
    public string UserId { get; set; } = null!;
    
    [Column("theme")]
    public Theme Theme { get; set; } = Theme.Dark;
    
    [Column("weight_unit")]
    public WeightUnit WeightUnit { get; set; } = WeightUnit.Lbs;
    
    [Column("distance_unit")]
    public DistanceUnit DistanceUnit { get; set; } = DistanceUnit.Meters;
    
    [Column("effort_type")]
    public EffortRatingType EffortType { get; set; } = EffortRatingType.Rpe;
    
    [Column("show_one_rep_max")]
    public bool ShowOneRepMax { get; set; } = true;
    
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")] 
    public DateTime? UpdatedAt { get; set; } = null;
    
    // Navigation properties
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}