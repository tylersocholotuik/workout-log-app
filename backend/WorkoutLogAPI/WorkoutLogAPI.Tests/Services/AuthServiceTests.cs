using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Email;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.Tests.TestHelpers;

namespace WorkoutLogAPI.Tests.Services;

public class AuthServiceTests
{
    private static IConfiguration BuildConfiguration() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Frontend:BaseUrl"] = "https://example.com",
                ["PasswordReset:TokenExpirationInMinutes"] = "15"
            })
            .Build();
    
    private static (Mock<EmailService> emailServiceMock, AuthService authService, WorkoutDbContext context)
        CreateSut()
    {
        var context = InMemoryDbContextFactory.Create();
        var configuration = BuildConfiguration();
        var userService = new UserService(context, NullLogger<UserService>.Instance);
        var emailServiceMock = new Mock<EmailService>(NullLogger<EmailService>.Instance, configuration);
        emailServiceMock
            .Setup(m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var authService = new AuthService(
            configuration,
            NullLogger<AuthService>.Instance,
            context,
            emailServiceMock.Object,
            userService);

        return (emailServiceMock, authService, context);
    }

    [Fact]
    public async Task CreateUserAsync_WithNewEmail_CreatesUserWithHashedPassword()
    {
        var (_, authService, context) = CreateSut();

        var user = await authService.CreateUserAsync("new@example.com", "Jane", "Doe", null, "Password123!");

        Assert.NotEqual("Password123!", user.PasswordHash); // must be hashed, never stored in plain text
        Assert.True(BCrypt.Net.BCrypt.Verify("Password123!", user.PasswordHash));
        Assert.NotNull(await context.Users.FindAsync(user.Id));
    }

    [Fact]
    public async Task CreateUserAsync_WithExistingEmail_ThrowsInvalidOperationException()
    {
        var (_, authService, context) = CreateSut();
        context.Users.Add(new User { Id = "1", Email = "existing@example.com", FirstName = "A", LastName = "B", PasswordHash = "hash" });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => authService.CreateUserAsync("existing@example.com", "Jane", "Doe", null, "Password123!"));
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithCorrectPassword_ReturnsUserAndResetsFailedAttempts()
    {
        var (_, authService, context) = CreateSut();
        context.Users.Add(new User
        {
            Id = "1",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            FailedLoginAttempts = 2
        });
        await context.SaveChangesAsync();

        var result = await authService.AuthenticateUserAsync("test@example.com", "correct-password");

        Assert.Equal("1", result.Id);
        Assert.Equal(0, result.FailedLoginAttempts);
        Assert.NotNull(result.LastLoginAt);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithWrongPassword_IncrementsFailedAttemptsAndThrows()
    {
        var (_, authService, context) = CreateSut();
        context.Users.Add(new User
        {
            Id = "1",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            FailedLoginAttempts = 0
        });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => authService.AuthenticateUserAsync("test@example.com", "wrong-password"));

        var user = await context.Users.FindAsync("1");
        Assert.Equal(1, user!.FailedLoginAttempts);
        Assert.False(user.IsLocked);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithFifthConsecutiveWrongPassword_LocksAccount()
    {
        var (_, authService, context) = CreateSut();
        context.Users.Add(new User
        {
            Id = "1",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            FailedLoginAttempts = 4
        });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => authService.AuthenticateUserAsync("test@example.com", "wrong-password"));

        var user = await context.Users.FindAsync("1");
        Assert.Equal(5, user!.FailedLoginAttempts);
        Assert.True(user.IsLocked);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WhenAccountIsLocked_ThrowsWithoutCheckingPassword()
    {
        var (_, authService, context) = CreateSut();
        context.Users.Add(new User
        {
            Id = "1",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct-password"),
            IsLocked = true
        });
        await context.SaveChangesAsync();
        
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => authService.AuthenticateUserAsync("test@example.com", "correct-password"));
        Assert.Contains("locked", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AuthenticateUserAsync_WithUnknownEmail_ThrowsGenericInvalidCredentialsMessage()
    {
        // Important security detail: the error message must NOT reveal whether
        // the email exists in the system (that would let attackers enumerate
        // valid accounts). It should read identically to a wrong-password error.
        var (_, authService, _) = CreateSut();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => authService.AuthenticateUserAsync("nobody@example.com", "any-password"));

        Assert.Equal("Invalid email or password", ex.Message);
    }

    [Fact]
    public async Task GenerateAndSendPasswordResetTokenAsync_ForUnknownEmail_DoesNotSendEmailOrThrow()
    {
        // Same anti-enumeration principle as above: requesting a reset for an
        // email that isn't registered should silently no-op, not error out or
        // reveal anything via a sent email.
        var (emailServiceMock, authService, _) = CreateSut();

        await authService.GenerateAndSendPasswordResetTokenAsync("nobody@example.com");

        emailServiceMock.Verify(
            m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task PasswordResetRoundTrip_GenerateThenReset_UpdatesPasswordAndConsumesToken()
    {
        // This is an end-to-end test of the two AuthService methods that work
        // together: it generates a real reset token (captured from the body of
        // the "email" via Moq's Callback), then feeds that same token into
        // ResetPasswordAsync, proving the whole flow is internally consistent.
        var (emailServiceMock, authService, context) = CreateSut();
        context.Users.Add(new User
        {
            Id = "1",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("old-password")
        });
        await context.SaveChangesAsync();

        string? capturedEmailBody = null;
        emailServiceMock
            .Setup(m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()))
            .Callback<List<EmailAddress>, string, string>((_, _, body) => capturedEmailBody = body)
            .Returns(Task.CompletedTask);

        await authService.GenerateAndSendPasswordResetTokenAsync("test@example.com");

        Assert.NotNull(capturedEmailBody);
        var match = System.Text.RegularExpressions.Regex.Match(capturedEmailBody!, "token=([^\"&]+)");
        Assert.True(match.Success, "Expected the reset email body to contain a reset token URL.");
        var rawToken = match.Groups[1].Value;

        await authService.ResetPasswordAsync("new-password", rawToken);

        var user = await context.Users.FindAsync("1");
        Assert.True(BCrypt.Net.BCrypt.Verify("new-password", user!.PasswordHash));
        Assert.Empty(await context.PasswordResetTokens.ToListAsync());

        // Both the reset email and the "your password was changed" confirmation
        // email should have been sent.
        emailServiceMock.Verify(
            m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task ResetPasswordAsync_WithInvalidToken_ThrowsInvalidOperationException()
    {
        var (_, authService, _) = CreateSut();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => authService.ResetPasswordAsync("new-password", "not-a-real-token"));
    }

    [Fact]
    public async Task ResetPasswordAsync_WithExpiredToken_ThrowsInvalidOperationException()
    {
        var (_, authService, context) = CreateSut();
        context.Users.Add(new User { Id = "1", Email = "test@example.com", FirstName = "T", LastName = "U", PasswordHash = "hash" });

        const string rawToken = "expired-test-token";
        
        context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = "1",
            TokenHash = HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddMinutes(-5) // already expired
        });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => authService.ResetPasswordAsync("new-password", rawToken));
    }
    
    // Copy of the same hashing logic used in AuthService to ensure the test can generate the same hash for the token.
    // This method is private in AuthService, so we replicate it here for testing purposes.
    private static string HashToken(string token)
    {
        var tokenBytes = System.Text.Encoding.UTF8.GetBytes(token);
        var hashBytes = System.Security.Cryptography.SHA256.HashData(tokenBytes);
        return Convert.ToHexString(hashBytes);
    }
}
