using Microsoft.Extensions.Logging.Abstractions;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.Tests.TestHelpers;

namespace WorkoutLogAPI.Tests.Services;

public class UserServiceTests
{
    private static (WorkoutDbContext context, UserService service) CreateSut()
    {
        var context = InMemoryDbContextFactory.Create();
        var service = new UserService(context, NullLogger<UserService>.Instance);
        return (context, service);
    }

    [Fact]
    public async Task GetUserByEmailAsync_WhenUserExists_ReturnsUser()
    {
        var (context, service) = CreateSut();
        context.Users.Add(new User { Id = "1", Email = "test@example.com", FirstName = "Test", LastName = "User", PasswordHash = "hash" });
        await context.SaveChangesAsync();

        var result = await service.GetUserByEmailAsync("test@example.com");

        Assert.Equal("1", result.Id);
    }

    [Fact]
    public async Task GetUserByEmailAsync_WhenUserDoesNotExist_ThrowsKeyNotFoundException()
    {
        var (_, service) = CreateSut();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.GetUserByEmailAsync("missing@example.com"));
    }

    [Fact]
    public async Task UpdatePasswordAsync_UpdatesHashAndUnlocksAccount()
    {
        var (context, service) = CreateSut();
        var user = new User
        {
            Id = "1",
            Email = "test@example.com",
            FirstName = "Test",
            LastName = "User",
            PasswordHash = "old-hash",
            FailedLoginAttempts = 4,
            IsLocked = true
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        await service.UpdatePasswordAsync("1", "new-hash");

        var updated = await context.Users.FindAsync("1");
        Assert.Equal("new-hash", updated!.PasswordHash);
        Assert.Equal(0, updated.FailedLoginAttempts);
        Assert.False(updated.IsLocked);
        Assert.NotNull(updated.PasswordChangedAt);
    }
}
