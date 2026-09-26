using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.Validation;

/// <summary>
/// Validates that a nullable RPE value matches the rules enforced on the
/// frontend (SetsTableRow.tsx handleRPEChange): min 6, max 10, and in steps
/// of 0.5. Null values are considered valid since RPE is optional.
/// </summary>
public class RpeRangeAttribute : ValidationAttribute
{
    private const double Min = 6;
    private const double Max = 10;

    public RpeRangeAttribute()
        : base("RPE must be between 6 and 10 in steps of 0.5") { }

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
