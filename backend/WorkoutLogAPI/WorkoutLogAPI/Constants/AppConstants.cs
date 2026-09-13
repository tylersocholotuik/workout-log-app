namespace WorkoutLogAPI.Constants;

public static class AppConstants
{
    public static class EmailSubjects
    {
        public const string PasswordReset = "Reset your Workout Log password";
        public const string PasswordResetConfirmation = "Your Workout Log password has been reset";
    }

    public static class Auth
    {
        public const string TokenCookieName = "workout_auth_token";
        public const string CsrfHeaderName = "X-Requested-With";
    }
}