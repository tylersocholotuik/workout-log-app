using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace WorkoutLogAPI.Data.Converters;

/// <summary>
/// Stores an enum as its lowercase name (e.g. "lbs") instead of the default int,
/// so the column stays human-readable and matches the API's JSON values.
/// </summary>
public class LowercaseEnumConverter<TEnum> : ValueConverter<TEnum, string>
    where TEnum : struct, Enum
{
    public LowercaseEnumConverter() : base(
        value => value.ToString().ToLowerInvariant(),
        value => Enum.Parse<TEnum>(value, ignoreCase: true))
    {
    }
}
