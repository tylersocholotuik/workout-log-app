using System.Net.Http.Json;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit; 
using WorkoutLogAPI.DTOs.Email;

namespace WorkoutLogAPI.Services;

public class EmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    private static readonly HttpClient Client = new HttpClient();

    /// <summary>
    /// Sends an email to one or more recipients using either direct SMTP or the Brevo transactional
    /// email REST API, depending on the <paramref name="useSmtp"/> flag.
    /// </summary>
    /// <remarks>
    /// Two delivery paths are supported:
    /// <list type="bullet">
    /// <item>
    /// <description>
    /// <b>SMTP</b> (<paramref name="useSmtp"/> is <c>true</c>): connects directly to the SMTP host
    /// configured under <c>Smtp:Host</c>/<c>Smtp:Port</c> using MailKit. This path is blocked on
    /// hosts (e.g. Render's free tier) that don't allow outbound SMTP traffic, so it should only be
    /// enabled where SMTP connectivity is known to work (e.g. local development or paid hosting tiers).
    /// </description>
    /// </item>
    /// <item>
    /// <description>
    /// <b>Brevo API</b> (<paramref name="useSmtp"/> is <c>false</c>): sends the email via an HTTP
    /// POST to the Brevo transactional email endpoint (<c>Brevo:BaseUrl</c>), authenticated with
    /// <c>Brevo:ApiKey</c>. This is the default/recommended path since it works over standard HTTPS
    /// and isn't affected by SMTP port blocking.
    /// </description>
    /// </item>
    /// </list>
    /// Note that all recipients are visible to each other (via the "To" header/field) rather than
    /// being sent individually, since both paths add every recipient to the same message.
    /// </remarks>
    /// <param name="recipients">One or more recipients (email address + display name) to send the email to.</param>
    /// <param name="subject">The email subject line.</param>
    /// <param name="body">The HTML content of the email.</param>
    /// <param name="useSmtp">
    /// If <c>true</c>, sends via SMTP; if <c>false</c>, sends via the Brevo REST API.
    /// </param>
    /// <exception cref="ArgumentException">Thrown when <paramref name="recipients"/> is empty.</exception>
    /// <exception cref="InvalidOperationException">
    /// Thrown when required sender, SMTP, or Brevo API key configuration is missing, or when the
    /// Brevo API request fails.
    /// </exception>
    public async Task SendEmailAsync(IEnumerable<EmailRecipient> recipients, string subject, string body, bool useSmtp)
    {
        var recipientList = recipients.ToList();

        if (recipientList.Count == 0)
        {
            throw new ArgumentException("At least one recipient is required.", nameof(recipients));
        }

        try
        {
            var fromName = _configuration.GetValue<string>("Smtp:FromName", "Workout Log");
            var fromAddress = _configuration.GetValue<string>("Smtp:FromEmail");
            var smtpHost = _configuration.GetValue<string>("Smtp:Host");
            var smtpPort = _configuration.GetValue<int>("Smtp:Port", 587);
            var smtpUsername = _configuration.GetValue<string>("Smtp:Username");
            var smtpPassword = _configuration.GetValue<string>("Smtp:Password");

            if (string.IsNullOrEmpty(fromAddress))
            {
                _logger.LogError("Sender email address configuration is missing.");
                throw new InvalidOperationException("Sender email address configuration is missing.");
            }

            if (useSmtp && (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword)))
            {
                _logger.LogError("SMTP configuration is missing or incomplete.");
                throw new InvalidOperationException("SMTP configuration is missing or incomplete.");
            }

            var recipientEmails = string.Join(", ", recipientList.Select(r => r.Email));

            if (useSmtp)
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(fromName, fromAddress));

                foreach (var recipient in recipientList)
                {
                    message.To.Add(new MailboxAddress(recipient.Name, recipient.Email));
                }

                message.Subject = subject;
                message.Body = new TextPart("html")
                {
                    Text = body
                };
        
                using var client = new SmtpClient();
            
                client.CheckCertificateRevocation = false;

                await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(smtpUsername, smtpPassword);
                await client.SendAsync(message);
            
                _logger.LogInformation("Sending email to {To} with subject '{Subject}'", recipientEmails, subject);
            
                await client.DisconnectAsync(true);
            }
            else
            {
                // If SMTP is disabled, use the Brevo API.
                
                var brevoApiKey = _configuration.GetValue<string>("Brevo:ApiKey");

                if (string.IsNullOrEmpty(brevoApiKey))
                {
                    _logger.LogError("Brevo API key is missing.");
                    throw new InvalidOperationException("Brevo API key is missing.");
                }
                
                // SendEmailRequest and EmailSender are DTOs that match the expected JSON structure for the Brevo API.
                var sender = new EmailSender(Name: fromName, Email: fromAddress);

                var message = new SendEmailRequest(
                    Sender: sender,
                    To: recipientList,
                    Subject: subject,
                    HtmlContent: body
                );

                var baseUrl = _configuration.GetValue<string>("Brevo:BaseUrl", "https://api.brevo.com/v3/smtp/email");
                
                using var request = new HttpRequestMessage(HttpMethod.Post, baseUrl)
                {
                    Content = JsonContent.Create(message),
                    Headers =
                    {
                        { "accept", "application/json" },
                        { "api-key", brevoApiKey }
                    }
                };
                
                var response = await Client.SendAsync(request);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Failed to send email via Brevo API. Status Code: {StatusCode}, Response: {Response}", response.StatusCode, errorContent);
                    throw new InvalidOperationException($"Failed to send email via Brevo API. Status Code: {response.StatusCode}, Response: {errorContent}");
                }
                
                _logger.LogInformation("Email sent successfully to {To} with subject '{Subject}' via Brevo API", recipientEmails, subject);
                
            }
        }
        catch (Exception e)
        {
            _logger.LogError(e, "An error occurred while trying to send email: {Message}", e.Message);
            throw;
        }
    }
}