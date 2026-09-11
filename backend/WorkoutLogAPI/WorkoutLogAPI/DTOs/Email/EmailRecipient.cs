using System.Text.Json.Serialization;

namespace WorkoutLogAPI.DTOs.Email;

public record EmailRecipient(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("name")] string Name
    );