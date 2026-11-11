using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit; 
using WorkoutLogAPI.DTOs.Email;
using WorkoutLogAPI.Constants;

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
    
    public async Task SendPasswordResetEmailAsync(string email, string toName, string resetToken, int expirationMinutes)
    {
        try
        {
            var baseUrl = _configuration.GetValue<string>("Frontend:BaseUrl");
            var resetUrl = $"{baseUrl}/reset-password?token={resetToken}";
            var subject = AppConstants.EmailSubjects.PasswordReset;
            var body = $"""
                        <p>Hi {toName},</p>
                        <p>We received a request to reset the password for your Workout Log account. Click the button below to choose a new one:</p>
                        <p>
                            <a href="{resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#0d6efd;color:#ffffff;text-decoration:none;border-radius:4px;">
                                Reset Password
                            </a>
                        </p>
                        <p>This link will expire in {expirationMinutes} minutes and can only be used once.</p>
                        <p>If you didn't request a password reset, you can safely ignore this email &mdash; your password will not be changed.</p>
                        """;
            
            await SendEmailAsync([new EmailAddress(email, toName)], subject, body);
            _logger.LogInformation("Password reset email sent to {Email}", email);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending password reset email to {Email}: {Message}", email, ex.Message);
            throw;
        }
    }
    
    public async Task SendPasswordResetConfirmationEmailAsync(string email, string toName)
    {
        const string subject = AppConstants.EmailSubjects.PasswordResetConfirmation;
        var body = $"""
                    <p>Hi {toName},</p>
                    <p>Your password has been successfully reset. If you did not perform this action, please contact our support team immediately.</p>
                    """;
        
        await SendEmailAsync([new EmailAddress(email, toName)], subject, body);
        _logger.LogInformation("Password reset confirmation email sent to {Email}", email);
    }
    
    public async Task SendPasswordChangeConfirmationEmailAsync(string email, string toName)
    {
        const string subject = AppConstants.EmailSubjects.PasswordChangeConfirmation;
        var body = $"""
                    <p>Hi {toName},</p>
                    <p>
                        Your password has been successfully changed from your account settings.
                        If you did not perform this action, please contact our support team immediately.
                    </p>
                    """;
        
        await SendEmailAsync([new EmailAddress(email, toName)], subject, body);
        _logger.LogInformation("Password change confirmation email sent to {Email}", email);
    }
    
    // Sends an email to the original address so an attacker cannot change the email without the original owner knowing.
    public async Task SendEmailChangeConfirmationAsync(string originalEmail, string newEmail, string toName)
    {
        const string subject = AppConstants.EmailSubjects.EmailChangeConfirmation;
        var body = $"""
                    <p>Hi {toName},</p>
                    <p>
                        Your email address for your Workout Log account has been changed to {newEmail}. 
                        If you did not perform this action, please contact our support team immediately.
                    </p>
                    """;
        await SendEmailAsync([new EmailAddress(originalEmail, toName)], subject, body);
        _logger.LogInformation("Email change confirmation sent to {Email}", originalEmail);
    }

    /// <summary>
    /// Sends an email to one or more recipients using either direct SMTP or the Brevo transactional
    /// email REST API, depending on the <c>Smtp:EnableSmtp</c> configuration setting.
    /// </summary>
    /// <remarks>
    /// Two delivery paths are supported:
    /// <list type="bullet">
    /// <item>
    /// <description>
    /// <b>SMTP</b> (<c>Smtp:EnableSmtp</c> is <c>true</c>): connects directly to the SMTP host
    /// configured under <c>Smtp:Host</c>/<c>Smtp:Port</c> using MailKit. This path is blocked on
    /// hosts (e.g. Render's free tier) that don't allow outbound SMTP traffic, so it should only be
    /// enabled where SMTP connectivity is known to work (e.g. local development or paid hosting tiers).
    /// </description>
    /// </item>
    /// <item>
    /// <description>
    /// <b>Brevo API</b> (<c>Smtp:EnableSmtp</c> is <c>false</c>): sends the email via an HTTP
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
    /// <exception cref="ArgumentException">Thrown when <paramref name="recipients"/> is empty.</exception>
    /// <exception cref="InvalidOperationException">
    /// Thrown when required sender, SMTP, or Brevo API key configuration is missing, or when the
    /// Brevo API request fails.
    /// </exception>
    public virtual async Task SendEmailAsync(List<EmailAddress> recipients, string subject, string body)
    {
        if (recipients.Count == 0)
        {
            throw new ArgumentException("At least one recipient is required.", nameof(recipients));
        }

        try
        {
            var fromName = _configuration.GetValue<string>("Smtp:FromName", "Workout Log");
            var fromAddress = _configuration.GetValue<string>("Smtp:FromEmail");
            var useSmtp = _configuration.GetValue("Smtp:EnableSmtp", false);

            if (string.IsNullOrEmpty(fromAddress))
            {
                _logger.LogError("Sender email address configuration is missing.");
                throw new InvalidOperationException("Sender email address configuration is missing.");
            }

            var recipientEmails = string.Join(", ", recipients.Select(r => r.Email));
            
            if (useSmtp)
            {
                await SendViaSmtpAsync(recipients, fromName, fromAddress, subject, body, recipientEmails);
            }
            else
            {
                await SendViaBrevoApiAsync(recipients, fromName, fromAddress, subject, body, recipientEmails);
            }
        }
        catch (Exception e)
        {
            _logger.LogError(e, "An error occurred while trying to send email: {Message}", e.Message);
            throw;
        }
    }

    private async Task SendViaSmtpAsync(List<EmailAddress> recipientList, string fromName, string fromAddress, string subject, string body, string recipientEmails)
    {
        var smtpHost = _configuration.GetValue<string>("Smtp:Host");
        var smtpPort = _configuration.GetValue<int>("Smtp:Port", 587);
        var smtpUsername = _configuration.GetValue<string>("Smtp:Username");
        var smtpPassword = _configuration.GetValue<string>("Smtp:Password");

        if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword))
        {
            _logger.LogError("SMTP configuration is missing or incomplete.");
            throw new InvalidOperationException("SMTP configuration is missing or incomplete.");
        }

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

        _logger.LogInformation("Email sent successfully to {To} with subject '{Subject}' via SMTP", recipientEmails, subject);

        await client.DisconnectAsync(true);
    }

    private async Task SendViaBrevoApiAsync(List<EmailAddress> recipientList, string fromName, string fromAddress, string subject, string body, string recipientEmails)
    {
        var brevoApiKey = _configuration.GetValue<string>("Brevo:ApiKey");

        if (string.IsNullOrEmpty(brevoApiKey))
        {
            _logger.LogError("Brevo API key is missing.");
            throw new InvalidOperationException("Brevo API key is missing.");
        }

        // SendEmailRequest and EmailAddress are DTOs that match the expected JSON structure for the Brevo API.
        var sender = new EmailAddress(Name: fromName, Email: fromAddress);

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