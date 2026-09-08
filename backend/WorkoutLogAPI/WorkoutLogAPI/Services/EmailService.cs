using MailKit.Net.Smtp;  
using MimeKit; 

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

    public async Task SendEmailAsync(string emailTo, string subject, string toName, string body)
    {
        try
        {
            var fromName = _configuration.GetValue<string>("Smtp:FromName", "Workout Log");
            var fromAddress = _configuration.GetValue<string>("Smtp:FromEmail");
            var smtpHost = _configuration.GetValue<string>("Smtp:Host");
            var smtpPort = _configuration.GetValue<int>("Smtp:Port", 587);
            var smtpUsername = _configuration.GetValue<string>("Smtp:Username");
            var smtpPassword = _configuration.GetValue<string>("Smtp:Password");
        
            if (string.IsNullOrEmpty(smtpHost) || string.IsNullOrEmpty(smtpUsername) || string.IsNullOrEmpty(smtpPassword) || string.IsNullOrEmpty(fromAddress))
            {
                _logger.LogError("SMTP configuration is missing or incomplete.");
                throw new InvalidOperationException("SMTP configuration is missing or incomplete.");
            }
        
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromAddress));
            message.To.Add(new MailboxAddress(toName, emailTo));
            message.Subject = subject;
            message.Body = new TextPart("html")
            {
                Text = body
            };
        
            using var client = new SmtpClient();
            
            client.CheckCertificateRevocation = false;

            await client.ConnectAsync(smtpHost, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(smtpUsername, smtpPassword);
            await client.SendAsync(message);
            
            _logger.LogInformation("Sending email to {To} with subject '{Subject}'", emailTo, subject);
            
            await client.DisconnectAsync(true);
        }
        catch (Exception e)
        {
            _logger.LogError(e, "An error occurred while trying to send email: {Message}", e.Message);
            throw;
        }
    }
}