using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace WorkoutLogAPI.Models;

// Tracks JWTs that have been explicitly invalidated (e.g. via logout) before
// their natural expiry, so they can be rejected even though the signature
// and lifetime would otherwise still validate.
[Table("revoked_tokens")]
public class RevokedToken
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("jti")]
    public string Jti { get; set; } = null!;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("revoked_at")]
    public DateTime RevokedAt { get; set; } = DateTime.UtcNow;
}
