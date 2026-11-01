using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.Validation;

/// <summary>
/// Validates that a nullable distance value matches the rules enforced on the frontend: min 0, max 9999 and in steps of 0.1.
/// Null values are considered valid since distance is optional.
/// </summary>
public class DistanceRangeAttribute : ValidationAttribute
{
    private const double Min = 0;
    private const double Max = 9999;
    
    public DistanceRangeAttribute()
        : base("Distance must be between 0 and 9999 in steps of 0.1") { }
    
    public override bool IsValid(object? value)
    {
        if (value is null)
        {
            return true;
        }

        if (value is not double distance)
        {
            return false;
        }
        
        // multiplying by 10 turns the 0.1 step requirement into a whole number
        // avoiding floating point precision issues from using % 0.1
        var timesTen = distance * 10;

        return distance >= Min
               && distance <= Max
               && Math.Abs(timesTen - Math.Round(timesTen)) < 0.0001;
    }
}