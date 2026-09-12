using System.Text.Json.Serialization;

namespace WorkoutLogAPI.DTOs.Email;

public record SendEmailRequest(
    [property: JsonPropertyName("sender")] EmailAddress Sender,
    [property: JsonPropertyName("to")] List<EmailAddress> To,
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("htmlContent")] string HtmlContent
    );