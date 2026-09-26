using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.Validation;

/// <summary>
/// Validates that a nullable weight value matches the rules enforced on the
/// frontend (SetsTableRow.tsx handleWeightChange): min 0, max 9999, and in
/// steps of 0.5. Null values are considered valid since weight is optional.
/// </summary>
public class WeightRangeAttribute : ValidationAttribute
{
    private const double Min = 0;
    private const double Max = 9999;

    public WeightRangeAttribute()
        : base("Weight must be between 0 and 9999 in steps of 0.5") { }

    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        if (value is not double weight)
        {
            return false;
        }

        // multiplying by 2 turns the 0.5 step requirement into a whole number
        // check, avoiding floating point precision issues from using % 0.5
        var doubled = weight * 2;

        return weight >= Min
            && weight <= Max
            && Math.Abs(doubled - Math.Round(doubled)) < 0.0001;
    }
}
