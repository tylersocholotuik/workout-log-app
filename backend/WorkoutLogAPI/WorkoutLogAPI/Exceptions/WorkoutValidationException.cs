namespace WorkoutLogAPI.Exceptions;

public class WorkoutValidationException : Exception
{
    public Dictionary<string, List<string>> Errors { get; }
    
    public WorkoutValidationException(Dictionary<string, List<string>> errors)
        : base("Workout validation failed")
    {
        Errors = errors;
    }
}