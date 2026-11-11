using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Email;
using WorkoutLogAPI.DTOs.Users;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.Tests.TestHelpers;

namespace WorkoutLogAPI.Tests.Services;

public class UserServiceTests
{
    private static (WorkoutDbContext context, Mock<EmailService> emailServiceMock, UserService service) CreateSut()
    {
        var context = InMemoryDbContextFactory.Create();
        var configuration = new ConfigurationBuilder().Build();
        var emailServiceMock = new Mock<EmailService>(NullLogger<EmailService>.Instance, configuration);
        emailServiceMock
            .Setup(m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var service = new UserService(context, emailServiceMock.Object, NullLogger<UserService>.Instance);
        return (context, emailServiceMock, service);
    }

    private static User SampleUser(string id = "1", string email = "test@example.com", string passwordHash = "hash") =>
        new()
        {
            Id = id,
            Email = email,
            FirstName = "Test",
            LastName = "User",
            PasswordHash = passwordHash
        };

    [Fact]
    public async Task GetUserByEmailAsync_WhenUserExists_ReturnsUser()
    {
        var (context, _, service) = CreateSut();
        context.Users.Add(SampleUser());
        await context.SaveChangesAsync();

        var result = await service.GetUserByEmailAsync("test@example.com");

        Assert.Equal("1", result.Id);
    }

    [Fact]
    public async Task GetUserByEmailAsync_WhenUserDoesNotExist_ThrowsKeyNotFoundException()
    {
        var (_, _, service) = CreateSut();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.GetUserByEmailAsync("missing@example.com"));
    }

    [Fact]
    public async Task UpdatePasswordAsync_UpdatesHashAndUnlocksAccount()
    {
        var (context, _, service) = CreateSut();
        var user = SampleUser(passwordHash: "old-hash");
        user.FailedLoginAttempts = 4;
        user.IsLocked = true;
        context.Users.Add(user);
        await context.SaveChangesAsync();

        await service.UpdatePasswordAsync("1", "new-hash");

        var updated = await context.Users.FindAsync("1");
        Assert.Equal("new-hash", updated!.PasswordHash);
        Assert.Equal(0, updated.FailedLoginAttempts);
        Assert.False(updated.IsLocked);
        Assert.NotNull(updated.PasswordChangedAt);
    }

    [Fact]
    public async Task ChangePasswordAsync_WithCorrectCurrentPassword_UpdatesHashAndSendsConfirmationEmail()
    {
        var (context, emailServiceMock, service) = CreateSut();
        context.Users.Add(SampleUser(passwordHash: BCrypt.Net.BCrypt.HashPassword("old-password")));
        await context.SaveChangesAsync();

        await service.ChangePasswordAsync("1", "old-password", "new-password");

        var updated = await context.Users.FindAsync("1");
        Assert.True(BCrypt.Net.BCrypt.Verify("new-password", updated!.PasswordHash));
        Assert.NotNull(updated.PasswordChangedAt);

        emailServiceMock.Verify(
            m => m.SendEmailAsync(
                It.Is<List<EmailAddress>>(r => r.Single().Email == "test@example.com"),
                WorkoutLogAPI.Constants.AppConstants.EmailSubjects.PasswordChangeConfirmation,
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task ChangePasswordAsync_WithWrongCurrentPassword_ThrowsAndDoesNotChangeHashOrSendEmail()
    {
        var (context, emailServiceMock, service) = CreateSut();
        var originalHash = BCrypt.Net.BCrypt.HashPassword("old-password");
        context.Users.Add(SampleUser(passwordHash: originalHash));
        await context.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ChangePasswordAsync("1", "wrong-password", "new-password"));

        Assert.Equal("Current password is incorrect", ex.Message);

        var user = await context.Users.FindAsync("1");
        Assert.Equal(originalHash, user!.PasswordHash);
        Assert.Null(user.PasswordChangedAt);

        emailServiceMock.Verify(
            m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenEmailSendFails_StillSucceeds()
    {
        // The password change must not fail just because the confirmation email
        // couldn't be sent (e.g. a transient SMTP/Brevo outage).
        var (context, emailServiceMock, service) = CreateSut();
        context.Users.Add(SampleUser(passwordHash: BCrypt.Net.BCrypt.HashPassword("old-password")));
        await context.SaveChangesAsync();

        emailServiceMock
            .Setup(m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("SMTP is down"));

        await service.ChangePasswordAsync("1", "old-password", "new-password");

        var updated = await context.Users.FindAsync("1");
        Assert.True(BCrypt.Net.BCrypt.Verify("new-password", updated!.PasswordHash));
    }

    [Fact]
    public async Task ChangePasswordAsync_WhenUserDoesNotExist_ThrowsKeyNotFoundException()
    {
        var (_, _, service) = CreateSut();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.ChangePasswordAsync("missing-id", "old-password", "new-password"));
    }

    [Fact]
    public async Task UpdateUserAsync_WithNewEmail_UpdatesEmailResetsVerificationAndNotifiesOriginalAddress()
    {
        var (context, emailServiceMock, service) = CreateSut();
        context.Users.Add(new User
        {
            Id = "1",
            Email = "old@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hash",
            IsEmailVerified = true
        });
        await context.SaveChangesAsync();

        var updated = await service.UpdateUserAsync("1", new PatchUserDto("new@example.com", null, null, null));

        Assert.Equal("new@example.com", updated.Email);
        Assert.False(updated.IsEmailVerified);

        // The confirmation must go to the ORIGINAL address, not the new one -
        // that's the whole point of the notification (catching unauthorized changes).
        emailServiceMock.Verify(
            m => m.SendEmailAsync(
                It.Is<List<EmailAddress>>(r => r.Single().Email == "old@example.com"),
                WorkoutLogAPI.Constants.AppConstants.EmailSubjects.EmailChangeConfirmation,
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateUserAsync_WithSameEmail_DoesNotResetVerificationOrSendEmail()
    {
        var (context, emailServiceMock, service) = CreateSut();
        context.Users.Add(new User
        {
            Id = "1",
            Email = "same@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "hash",
            IsEmailVerified = true
        });
        await context.SaveChangesAsync();

        var updated = await service.UpdateUserAsync("1", new PatchUserDto("same@example.com", "Updated", null, null));

        Assert.Equal("same@example.com", updated.Email);
        Assert.True(updated.IsEmailVerified);
        Assert.Equal("Updated", updated.FirstName);

        emailServiceMock.Verify(
            m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateUserAsync_WithEmailAlreadyTakenByAnotherUser_ThrowsInvalidOperationException()
    {
        var (context, _, service) = CreateSut();
        context.Users.Add(SampleUser("1", "mine@example.com"));
        context.Users.Add(SampleUser("2", "taken@example.com"));
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.UpdateUserAsync("1", new PatchUserDto("taken@example.com", null, null, null)));
    }

    [Fact]
    public async Task UpdateUserAsync_WhenEmailSendFails_StillPersistsEmailChange()
    {
        var (context, emailServiceMock, service) = CreateSut();
        context.Users.Add(SampleUser("1", "old@example.com"));
        await context.SaveChangesAsync();

        emailServiceMock
            .Setup(m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new InvalidOperationException("SMTP is down"));

        var updated = await service.UpdateUserAsync("1", new PatchUserDto("new@example.com", null, null, null));

        Assert.Equal("new@example.com", updated.Email);
    }

    [Fact]
    public async Task UpdateUserAsync_WhenUserDoesNotExist_ThrowsKeyNotFoundException()
    {
        var (_, _, service) = CreateSut();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.UpdateUserAsync("missing-id", new PatchUserDto("new@example.com", null, null, null)));
    }
}
