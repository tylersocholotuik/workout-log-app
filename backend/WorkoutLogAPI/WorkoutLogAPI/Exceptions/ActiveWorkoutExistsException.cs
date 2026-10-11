namespace WorkoutLogAPI.Exceptions;

public class ActiveWorkoutExistsException: InvalidOperationException
{
    public ActiveWorkoutExistsException(string message) : base(message)
    {
    }
}