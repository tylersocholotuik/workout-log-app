using Microsoft.Extensions.Logging.Abstractions;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Users;
using WorkoutLogAPI.Enums;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.Tests.TestHelpers;

namespace WorkoutLogAPI.Tests.Services;

public class UserSettingsServiceTests
{
    private static (WorkoutDbContext context, UserSettingsService service) CreateSut()
    {
        var context = InMemoryDbContextFactory.Create();
        var service = new UserSettingsService(context, NullLogger<UserSettingsService>.Instance);
        return (context, service);
    }

    private static UserSettings SampleSettings(string userId = "1") =>
        new()
        {
            UserId = userId,
            Theme = Theme.Dark,
            WeightUnit = WeightUnit.Lbs,
            DistanceUnit = DistanceUnit.Meters,
            EffortType = EffortRatingType.Rpe,
            ShowOneRepMax = true
        };

    [Fact]
    public async Task GetUserSettingsByUserIdAsync_WhenSettingsExist_ReturnsSettings()
    {
        var (context, service) = CreateSut();
        context.UserSettings.Add(SampleSettings());
        await context.SaveChangesAsync();

        var result = await service.GetUserSettingsByUserIdAsync("1");

        Assert.Equal("1", result.UserId);
        Assert.Equal(Theme.Dark, result.Theme);
    }

    [Fact]
    public async Task GetUserSettingsByUserIdAsync_WhenSettingsDoNotExist_ThrowsKeyNotFoundException()
    {
        var (_, service) = CreateSut();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.GetUserSettingsByUserIdAsync("missing-user"));
    }

    [Fact]
    public async Task UpdateUserSettingsAsync_WithAllFieldsProvided_UpdatesEveryField()
    {
        var (context, service) = CreateSut();
        context.UserSettings.Add(SampleSettings());
        await context.SaveChangesAsync();

        var updated = await service.UpdateUserSettingsAsync(
            "1", new PatchUserSettingsDto(Theme.Light, WeightUnit.Kg, DistanceUnit.Miles, EffortRatingType.Rir, false));

        Assert.Equal(Theme.Light, updated.Theme);
        Assert.Equal(WeightUnit.Kg, updated.WeightUnit);
        Assert.Equal(DistanceUnit.Miles, updated.DistanceUnit);
        Assert.Equal(EffortRatingType.Rir, updated.EffortType);
        Assert.False(updated.ShowOneRepMax);
    }

    [Fact]
    public async Task UpdateUserSettingsAsync_WithOnlySomeFieldsProvided_LeavesOtherFieldsUnchanged()
    {
        var (context, service) = CreateSut();
        context.UserSettings.Add(SampleSettings());
        await context.SaveChangesAsync();

        var updated = await service.UpdateUserSettingsAsync(
            "1", new PatchUserSettingsDto(Theme.Light, null, null, null, null));

        Assert.Equal(Theme.Light, updated.Theme);
        // Everything else should retain its original sample value.
        Assert.Equal(WeightUnit.Lbs, updated.WeightUnit);
        Assert.Equal(DistanceUnit.Meters, updated.DistanceUnit);
        Assert.Equal(EffortRatingType.Rpe, updated.EffortType);
        Assert.True(updated.ShowOneRepMax);
    }

    [Fact]
    public async Task UpdateUserSettingsAsync_WithNoFieldsProvided_PersistsNoChanges()
    {
        var (context, service) = CreateSut();
        context.UserSettings.Add(SampleSettings());
        await context.SaveChangesAsync();

        var updated = await service.UpdateUserSettingsAsync(
            "1", new PatchUserSettingsDto(null, null, null, null, null));

        Assert.Equal(Theme.Dark, updated.Theme);
        Assert.Equal(WeightUnit.Lbs, updated.WeightUnit);
        Assert.Equal(DistanceUnit.Meters, updated.DistanceUnit);
        Assert.Equal(EffortRatingType.Rpe, updated.EffortType);
        Assert.True(updated.ShowOneRepMax);
    }

    [Fact]
    public async Task UpdateUserSettingsAsync_WithShowOneRepMaxExplicitlyFalse_UpdatesToFalse()
    {
        // Regression guard: ShowOneRepMax is a nullable bool, so the "is { } x"
        // pattern must still match `false` (as opposed to only truthy values).
        var (context, service) = CreateSut();
        context.UserSettings.Add(SampleSettings());
        await context.SaveChangesAsync();

        var updated = await service.UpdateUserSettingsAsync(
            "1", new PatchUserSettingsDto(null, null, null, null, false));

        Assert.False(updated.ShowOneRepMax);
    }

    [Fact]
    public async Task UpdateUserSettingsAsync_WhenSettingsDoNotExist_ThrowsKeyNotFoundException()
    {
        var (_, service) = CreateSut();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.UpdateUserSettingsAsync(
                "missing-user", new PatchUserSettingsDto(Theme.Light, null, null, null, null)));
    }
}
