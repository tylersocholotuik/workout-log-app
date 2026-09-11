using System.Text.Json.Serialization;

namespace WorkoutLogAPI.DTOs.Email;

public record EmailSender(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("email")] string Email
    );