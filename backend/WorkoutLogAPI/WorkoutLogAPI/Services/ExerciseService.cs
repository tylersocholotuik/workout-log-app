using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.Services;

public class ExerciseService
{
    private readonly WorkoutDbContext _context;

    public ExerciseService(WorkoutDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<Exercise>> GetExercisesAsync(string userId)
    {
        // Fetch exercises that belong to the user or are system exercises (UserId is null)
        // Filter out deleted exercises and order by name
        return await _context.Exercises
            .Where(e => (e.UserId == userId || e.UserId == null) && !e.Deleted)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }
}