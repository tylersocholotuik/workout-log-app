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
