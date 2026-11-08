using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.Validation;

/// <summary>
/// Validates that a nullable duration value matches the rules enforced on the frontend: min 0, max 599999 and must be a whole number.
/// Null values are considered valid since duration is optional.
/// </summary>
public class DurationRangeAttribute : ValidationAttribute
{
    private const int Min = 0;
    // 9999 minutes and 59 seconds in seconds
    // The frontend minutes input field is limited to 4 digits, so the max duration is 9999 minutes and 59 seconds.
    private const int Max = 9999 * 60 + 59; 

    public DurationRangeAttribute()
        : base("Duration must be a whole number between 0 and 599999") { }

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