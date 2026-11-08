using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Constants;
using WorkoutLogAPI.Data;

namespace WorkoutLogAPI.Extensions;

public static class DatabaseExtensions
{
    public static async Task SeedDatabaseAsync(this IApplicationBuilder app)
    {
        using var scope = app.ApplicationServices.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<WorkoutDbContext>();
        
        // Apply any pending migrations
        await context.Database.MigrateAsync();
        
        // Seed test user if it doesn't exist
        if (!await context.Users.AnyAsync(u => u.Email == AppConstants.SeedData.TestUserEmail))
        {
            var users = UserSeedData.GetSeedUsers();
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
            
            var testUserList = string.Join(", ", users.Select(u => u.Email));
            
            Console.WriteLine($"Seeded test users to the database: {testUserList}");
        }
        
        // Seed system exercises if they don't exist
        var existingExerciseNames = await context.Exercises
            .Where(e => e.UserId == null)
            .Select(e => e.Name)
            .ToHashSetAsync();
        
        var seedExercises = ExerciseSeedData.GetSeedExercises()
            .Where(e => !existingExerciseNames.Contains(e.Name))
            .ToList();
        
        if (seedExercises.Count > 0)
        {
            await context.Exercises.AddRangeAsync(seedExercises);
            await context.SaveChangesAsync();
            
            Console.WriteLine($"Seeded {seedExercises.Count} exercises to the database.");
        }
        
        // Seed test user workouts if they don't exist
        if (!await context.Workouts.AnyAsync(w => w.User.Email == AppConstants.SeedData.TestUserEmail))
        {
            var testUserId = await context.Users
                .Where(u => u.Email == AppConstants.SeedData.TestUserEmail)
                .Select(u => u.Id)
                .FirstOrDefaultAsync();

            if (testUserId is not null)
            {
                var workouts = WorkoutSeedData.GetSeedWorkouts(testUserId);
                await context.Workouts.AddRangeAsync(workouts);
                await context.SaveChangesAsync();

                Console.WriteLine($"Seeded {workouts.Count} test user workouts to the database.");
            }
            else
            {
                Console.WriteLine("Skipped seeding test user workouts: test user not found.");
            }
        }
    }
}
