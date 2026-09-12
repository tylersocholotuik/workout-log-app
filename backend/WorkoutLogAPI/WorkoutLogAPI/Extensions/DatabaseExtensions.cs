using Microsoft.EntityFrameworkCore;
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
        if (!await context.Users.AnyAsync(u => u.Email == "workoutlogtestuser@gmail.com"))
        {
            var users = UserSeedData.GetSeedUsers();
            await context.Users.AddRangeAsync(users);
            await context.SaveChangesAsync();
            
            var testUserList = string.Join(", ", users.Select(u => u.Email));
            
            Console.WriteLine($"Seeded test users to the database: {testUserList}");
        }
        
        // Seed test user workouts if they don't exist
        if (!await context.Workouts.AnyAsync(w => w.User.Email == "workoutlogtestuser@gmail.com"))
        {
            var testUserId = await context.Users
                .Where(u => u.Email == "workoutlogtestuser@gmail.com")
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
        
        // Seed exercises if they don't exist
        if (!await context.Exercises.AnyAsync())
        {
            var exercises = ExerciseSeedData.GetSeedExercises();
            await context.Exercises.AddRangeAsync(exercises);
            await context.SaveChangesAsync();
            
            Console.WriteLine($"Seeded {exercises.Count} exercises to the database.");
        }
    }
}
