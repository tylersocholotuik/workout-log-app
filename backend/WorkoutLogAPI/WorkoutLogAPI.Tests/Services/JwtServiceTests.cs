using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.Tests.TestHelpers;

namespace WorkoutLogAPI.Tests.Services;

public class JwtServiceTests
{
    private static IConfiguration BuildConfiguration(
        string refreshThresholdMinutes = "30",
        string tokenExpirationMinutes = "180") =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                // A throwaway signing key - fine for tests, never used for real tokens.
                ["Jwt:SecretKey"] = "this-is-a-test-only-secret-key-1234567890",
                ["Jwt:Issuer"] = "test-issuer",
                ["Jwt:Audience"] = "test-audience",
                ["Jwt:TokenExpirationInMinutes"] = tokenExpirationMinutes,
                ["Jwt:RefreshThresholdInMinutes"] = refreshThresholdMinutes
            })
            .Build();

    private static (JwtService jwtService, WorkoutDbContext context) CreateSut(
        string refreshThresholdMinutes = "30", bool isDevelopment = true)
    {
        // JwtService.RevokeTokenAsync uses ExecuteDeleteAsync, which the EF Core
        // InMemory provider doesn't support - it requires a real relational
        // provider. SQLite (in-memory) fills that gap here.
        var context = SqliteInMemoryDbContextFactory.Create();
        var configuration = BuildConfiguration(refreshThresholdMinutes);
        var userService = new UserService(context, NullLogger<UserService>.Instance);

        // IWebHostEnvironment is a first-party interface, so it can be mocked
        // directly with Moq with no changes needed to production code.
        var environmentMock = new Mock<IWebHostEnvironment>();
        environmentMock.Setup(e => e.EnvironmentName).Returns(isDevelopment ? "Development" : "Production");

        var jwtService = new JwtService(configuration, context, userService, environmentMock.Object);
        return (jwtService, context);
    }
    
    private static ClaimsPrincipal BuildPrincipal(params Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, authenticationType: "TestAuth");
        return new ClaimsPrincipal(identity);
    }

    [Fact]
    public void GenerateToken_FromUser_ProducesTokenContainingExpectedClaims()
    {
        var (jwtService, _) = CreateSut();
        var user = new User
        {
            Id = "user-1",
            Email = "test@example.com",
            FirstName = "Jane",
            LastName = "Doe",
            DisplayName = "JD",
            PasswordHash = "hash",
            IsAdmin = true
        };

        var token = jwtService.GenerateToken(user);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        Assert.Equal("user-1", jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.Equal("test@example.com", jwt.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal("True", jwt.Claims.First(c => c.Type == "is_admin").Value);
    }

    [Fact]
    public void ShouldRefreshToken_WhenTokenExpiresWithinThreshold_ReturnsTrue()
    {
        var (jwtService, _) = CreateSut(refreshThresholdMinutes: "30");
        // Token expires in 10 minutes, which is inside the 30-minute refresh window.
        var exp = DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds().ToString();
        var principal = BuildPrincipal(new Claim(JwtRegisteredClaimNames.Exp, exp));

        Assert.True(jwtService.ShouldRefreshToken(principal));
    }

    [Fact]
    public void ShouldRefreshToken_WhenTokenHasPlentyOfTimeLeft_ReturnsFalse()
    {
        var (jwtService, _) = CreateSut(refreshThresholdMinutes: "30");
        // Token expires in 2 hours - well outside the 30-minute refresh window.
        var exp = DateTimeOffset.UtcNow.AddHours(2).ToUnixTimeSeconds().ToString();
        var principal = BuildPrincipal(new Claim(JwtRegisteredClaimNames.Exp, exp));

        Assert.False(jwtService.ShouldRefreshToken(principal));
    }

    [Fact]
    public void ShouldRefreshToken_WhenTokenAlreadyExpired_ReturnsFalse()
    {
        // An already-expired token shouldn't be silently refreshed - it should
        // be rejected outright by the auth pipeline instead.
        var (jwtService, _) = CreateSut(refreshThresholdMinutes: "30");
        var exp = DateTimeOffset.UtcNow.AddMinutes(-5).ToUnixTimeSeconds().ToString();
        var principal = BuildPrincipal(new Claim(JwtRegisteredClaimNames.Exp, exp));

        Assert.False(jwtService.ShouldRefreshToken(principal));
    }

    [Fact]
    public async Task RevokeTokenAsync_ThenIsTokenRevokedAsync_ReturnsTrueForThatToken()
    {
        var (jwtService, _) = CreateSut();
        var user = new User { Id = "user-1", Email = "test@example.com", FirstName = "J", LastName = "D", PasswordHash = "hash" };
        var token = jwtService.GenerateToken(user);
        var jti = new JwtSecurityTokenHandler().ReadJwtToken(token).Claims.First(c => c.Type == JwtRegisteredClaimNames.Jti).Value;

        var revoked = await jwtService.RevokeTokenAsync(token);
        var isRevoked = await jwtService.IsTokenRevokedAsync(jti);

        Assert.True(revoked);
        Assert.True(isRevoked);
    }

    [Fact]
    public async Task IsTokenRevokedAsync_ForNeverRevokedJti_ReturnsFalse()
    {
        var (jwtService, _) = CreateSut();

        var result = await jwtService.IsTokenRevokedAsync(Guid.NewGuid().ToString());

        Assert.False(result);
    }

    [Fact]
    public async Task HasPasswordChangedSinceTokenIssuedAsync_WhenPasswordChangedAfterTokenIssued_ReturnsTrue()
    {
        // Security-critical behavior: if a user changes their password, any
        // token issued before that change must be rejected on the next
        // request, even if it hasn't technically expired yet.
        var (jwtService, context) = CreateSut();
        var issuedAt = DateTimeOffset.UtcNow.AddHours(-1);
        context.Users.Add(new User
        {
            Id = "user-1",
            Email = "test@example.com",
            FirstName = "J",
            LastName = "D",
            PasswordHash = "hash",
            PasswordChangedAt = DateTime.UtcNow // changed after the token was issued
        });
        await context.SaveChangesAsync();

        var principal = BuildPrincipal(
            new Claim(JwtRegisteredClaimNames.Sub, "user-1"),
            new Claim(JwtRegisteredClaimNames.Iat, issuedAt.ToUnixTimeSeconds().ToString()));

        Assert.True(await jwtService.HasPasswordChangedSinceTokenIssuedAsync(principal));
    }

    [Fact]
    public async Task HasPasswordChangedSinceTokenIssuedAsync_WhenPasswordUnchangedSinceTokenIssued_ReturnsFalse()
    {
        var (jwtService, context) = CreateSut();
        context.Users.Add(new User
        {
            Id = "user-1",
            Email = "test@example.com",
            FirstName = "J",
            LastName = "D",
            PasswordHash = "hash",
            PasswordChangedAt = null
        });
        await context.SaveChangesAsync();

        var principal = BuildPrincipal(
            new Claim(JwtRegisteredClaimNames.Sub, "user-1"),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()));

        Assert.False(await jwtService.HasPasswordChangedSinceTokenIssuedAsync(principal));
    }
}
