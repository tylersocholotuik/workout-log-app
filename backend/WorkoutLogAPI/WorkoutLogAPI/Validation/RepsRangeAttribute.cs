using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.Validation;

/// <summary>
/// Validates that a nullable reps value matches the rules enforced on the
/// frontend (SetsTableRow.tsx handleRepsChange): whole number, min 0, max 9999.
/// Null values are considered valid since reps is optional.
/// </summary>
public class RepsRangeAttribute : ValidationAttribute
{
    private const int Min = 0;
    private const int Max = 9999;

    public RepsRangeAttribute()
        : base("Reps must be a whole number between 0 and 9999") { }

    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        if (value is not int reps)
        {
            return false;
        }

        return reps >= Min && reps <= Max;
    }
}
