using System.Text.Json.Serialization;

namespace WorkoutLogAPI.DTOs.Email;

public record EmailAddress(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("name")] string Name
    );
