using WorkoutLogAPI.Models;
using WorkoutLogAPI.Enums;

namespace WorkoutLogAPI.DTOs.Users;

public record UserSettingsDto(
    Theme Theme,
    WeightUnit WeightUnit,
    DistanceUnit DistanceUnit,
    EffortRatingType EffortType,
    bool ShowOneRepMax
)
{
    public static UserSettingsDto FromUserSettings(UserSettings settings) =>
        new(settings.Theme, settings.WeightUnit, settings.DistanceUnit, settings.EffortType, settings.ShowOneRepMax);
}