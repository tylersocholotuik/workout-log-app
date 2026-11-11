using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Users;
using WorkoutLogAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace WorkoutLogAPI.Services;

public class UserSettingsService
{
    private readonly WorkoutDbContext _dbContext;
    private readonly ILogger<UserSettingsService> _logger;

    public UserSettingsService(WorkoutDbContext dbContext, ILogger<UserSettingsService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<UserSettings> GetUserSettingsByUserIdAsync(string userId)
    {
        UserSettings? settings;
        try
        {
            settings = await _dbContext.UserSettings.FirstOrDefaultAsync(us => us.UserId == userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user settings by user ID: {Message}", ex.Message);
            throw;
        }

        if (settings == null)
        {
            _logger.LogWarning("User settings for user ID {UserId} not found.", userId);
            throw new KeyNotFoundException("User settings for this user ID were not found.");
        }

        return settings;
    }
    
    public async Task<UserSettings> UpdateUserSettingsAsync(string userId, PatchUserSettingsDto dto)
    {
        try
        {
            var settings = await GetUserSettingsByUserIdAsync(userId);
            
            // Update only the properties that are provided in the DTO
            if (dto.Theme is { } theme) settings.Theme = theme;
            if (dto.WeightUnit is { } weightUnit) settings.WeightUnit = weightUnit;
            if (dto.DistanceUnit is { } distanceUnit) settings.DistanceUnit = distanceUnit;
            if (dto.EffortType is { } effortType) settings.EffortType = effortType;
            if (dto.ShowOneRepMax is { } showOneRepMax) settings.ShowOneRepMax = showOneRepMax;

            await _dbContext.SaveChangesAsync();
            return settings;
        }
        catch (KeyNotFoundException)
        {
            // Already logged in GetUserSettingsByUserIdAsync
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while updating user settings for user ID {UserId}: {Message}", userId, ex.Message);
            throw;
        }
    }
}