using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Moq;
using WorkoutLogAPI.DTOs.Email;
using WorkoutLogAPI.Services;
using Xunit;

namespace WorkoutLogAPI.Tests.Integration;

/// <summary>
/// Boots a real, in-process instance of the API (via <see cref="Program"/>) for
/// integration tests, running against a real Postgres database - the same engine,
/// same Npgsql provider, and same EF Core migrations used in production - rather than
/// a lightweight stand-in. See <see cref="PostgresContainerFixture"/> for how that
/// database is provisioned.
///
/// The only pieces swapped out are things that would otherwise reach real external
/// (non-database) infrastructure:
/// <list type="bullet">
/// <item><description>
/// <see cref="EmailService"/> is replaced with a mock so tests that exercise
/// forgot-password/reset-password flows don't make real outbound HTTP/SMTP calls.
/// </description></item>
/// <item><description>
/// Configuration values that are blank in appsettings.json (JWT secret, allowed CORS
/// origins) are supplied so the app can start.
/// </description></item>
/// </list>
///
/// Implements <see cref="IAsyncLifetime"/> to provision (and later tear down) its own
/// short-lived database inside the shared <see cref="PostgresContainerFixture"/>
/// container, so each test class runs against real Postgres migrations without needing
/// its own container.
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgresContainerFixture _postgres;
    private readonly string _databaseName = $"test_{Guid.NewGuid():N}";
    private string? _connectionString;

    public Mock<EmailService> EmailServiceMock { get; } =
        new(Mock.Of<ILogger<EmailService>>(), Mock.Of<IConfiguration>());

    public CustomWebApplicationFactory(PostgresContainerFixture postgres)
    {
        _postgres = postgres;

        EmailServiceMock
            .Setup(m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
    }

    public async Task InitializeAsync()
    {
        _connectionString = await _postgres.CreateDatabaseAsync(_databaseName);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        await _postgres.DropDatabaseAsync(_databaseName);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = _connectionString
                    ?? throw new InvalidOperationException(
                        $"{nameof(InitializeAsync)} must run before the test server starts."),
                ["Jwt:Issuer"] = "WorkoutLogAPITests",
                ["Jwt:Audience"] = "WorkoutLogAppTests",
                ["Jwt:SecretKey"] = "integration-test-signing-key-please-ignore-1234567890",
                ["Jwt:TokenExpirationInMinutes"] = "180",
                ["Jwt:RefreshThresholdInMinutes"] = "30",
                ["Cors:AllowedOrigins:0"] = "http://localhost",
                ["Smtp:EnableSmtp"] = "false",
                ["Frontend:BaseUrl"] = "http://localhost",
                ["PasswordReset:TokenExpirationInMinutes"] = "15"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<EmailService>();
            services.AddScoped(_ => EmailServiceMock.Object);
        });
    }
}
