using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WorkoutLogAPI.Models;

[Table("password_reset_tokens")]
public class PasswordResetToken
{
    [Key]
    [Column("id")]
    public int Id { get; set; }
    
    [Column("user_id")]
    public string UserId { get; set; } = null!;
    
    [Column("token_hash")]
    public string TokenHash { get; set; } = null!;
    
    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }
}