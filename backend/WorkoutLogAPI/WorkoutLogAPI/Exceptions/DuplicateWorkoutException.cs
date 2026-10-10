namespace WorkoutLogAPI.Exceptions;

public class DuplicateWorkoutException: InvalidOperationException
{
    public DuplicateWorkoutException(string message) : base(message)
    {
    }
}