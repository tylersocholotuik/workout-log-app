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
    
    public static class SeedData
    {
        #region TestUser
        
        public const string TestUserEmail = "workoutlogtestuser@gmail.com";
        public const string TestUserFirstName = "Test";
        public const string TestUserLastName = "User";
        // This account is public for demonstration purposes, so the password is known and not sensitive.
        public const string TestUserPassword = "testuserpassword";
        
        #endregion
    }
}