using WorkoutLogAPI.Enums;

namespace WorkoutLogAPI.DTOs.Users;

// All properties are nullable: null means "leave this field unchanged" (JSON merge
// patch semantics), as opposed to UserSettingsDto, whose fields are always populated.
public record PatchUserSettingsDto(
    Theme? Theme,
    WeightUnit? WeightUnit,
    DistanceUnit? DistanceUnit,
    EffortRatingType? EffortType,
    bool? ShowOneRepMax
);
