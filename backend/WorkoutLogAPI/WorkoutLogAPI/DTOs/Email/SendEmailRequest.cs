using System.Text.Json.Serialization;

namespace WorkoutLogAPI.DTOs.Email;

public record SendEmailRequest(
    [property: JsonPropertyName("sender")] EmailSender Sender,
    [property: JsonPropertyName("to")] List<EmailRecipient> To,
    [property: JsonPropertyName("subject")] string Subject,
    [property: JsonPropertyName("htmlContent")] string HtmlContent
    );