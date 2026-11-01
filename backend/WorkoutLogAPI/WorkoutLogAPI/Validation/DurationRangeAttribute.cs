using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.Validation;

/// <summary>
/// Validates that a nullable duration value matches the rules enforced on the frontend: min 0, max 86399 and must be a whole number.
/// Null values are considered valid since duration is optional.
/// </summary>
public class DurationRangeAttribute : ValidationAttribute
{
    private const int Min = 0;
    private const int Max = 86399; // 23 hours, 59 minutes, 59 seconds

    public DurationRangeAttribute()
        : base("Duration must be a whole number between 0 and 86399") { }

    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        if (value is not int seconds)
        {
            return false;
        }

        return seconds >= Min && seconds <= Max;
    }
}