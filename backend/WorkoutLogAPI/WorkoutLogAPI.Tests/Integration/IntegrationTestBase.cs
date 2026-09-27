using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WorkoutLogAPI.Constants;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Auth;

namespace WorkoutLogAPI.Tests.Integration;

/// <summary>
/// Common setup/teardown for controller integration tests: provisions a fresh
/// <see cref="CustomWebApplicationFactory"/> (and its own Postgres database) and an
/// <see cref="HttpClient"/> pointed at it, and cleans both up afterwards.
///
/// Test classes must be decorated with <c>[Collection(PostgresCollection.Name)]</c> so
/// xUnit injects the shared <see cref="PostgresContainerFixture"/> constructor
/// parameter they pass through to this base class.
/// </summary>
public abstract class IntegrationTestBase : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    protected HttpClient Client { get; private set; } = null!;

    protected IntegrationTestBase(
        PostgresContainerFixture postgres,
        IReadOnlyDictionary<string, string?>? additionalConfiguration = null)
    {
        _factory = new CustomWebApplicationFactory(postgres, additionalConfiguration);
    }

    public async Task InitializeAsync()
    {
        await _factory.InitializeAsync();

        Client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    public async Task DisposeAsync()
    {
        Client.Dispose();
        await ((IAsyncLifetime)_factory).DisposeAsync();
    }

    /// <summary>
    /// Registers a brand-new user (unique email each call), promotes it to an admin
    /// directly in the database (there's no public API surface for this, by design),
    /// then logs in again so the returned auth cookie's token actually carries the
    /// "is_admin" claim - tokens only bake in claims at issue time, so the cookie from
    /// registration would still reflect the pre-promotion, non-admin user.
    /// </summary>
    protected async Task<string> CreateAdminUserAndGetAuthCookieAsync()
    {
        var email = $"{Guid.NewGuid():N}@example.com";
        const string password = "Password123!";

        await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/register", new RegisterRequest(email, "Admin", "User", null, password));

        using (var scope = _factory.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<WorkoutDbContext>();
            var user = await context.Users.FirstAsync(u => u.Email == email);
            user.IsAdmin = true;
            await context.SaveChangesAsync();
        }

        var loginResponse = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/login", new LoginRequest(email, password));

        return loginResponse.ExtractCookie(AppConstants.Auth.TokenCookieName)
            ?? throw new InvalidOperationException(
                "Login did not return an auth cookie; check the response for a validation error.");
    }
}
