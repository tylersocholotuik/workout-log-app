using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.Validation;

/// <summary>
/// Validates that a nullable effort rating value matches the rules enforced on the
/// frontend (SetsTableRow.tsx): min 0, max 10, and in steps of 0.5.
/// Null values are considered valid since effort rating is optional.
/// Note that RIR has additional validation rules not enforced here (must be an integer between 0 and 10).
/// </summary>
public class EffortRatingRangeAttribute : ValidationAttribute
{
    private const double Min = 0;
    private const double Max = 10;

    public EffortRatingRangeAttribute()
        : base("Effort rating must be between 0 and 10 in steps of 0.5") { }

    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        if (value is not double rpe)
        {
            return false;
        }

        // multiplying by 2 turns the 0.5 step requirement into a whole number
        // check, avoiding floating point precision issues from using % 0.5
        var doubled = rpe * 2;

        return rpe >= Min
            && rpe <= Max
            && Math.Abs(doubled - Math.Round(doubled)) < 0.0001;
    }
}
