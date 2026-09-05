using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Exercises;
using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.Services;

public class ExerciseService
{
    private readonly WorkoutDbContext _context;

    public ExerciseService(WorkoutDbContext context)
    {
        _context = context;
    }

    public async Task<Exercise> GetExerciseById(int id, string userId)
    {
        // Fetch the exercise by ID, ensuring it belongs to the user or is a system exercise (UserId is null)
        var exercise = await _context.Exercises.Where(e =>
                e.Id == id &&
                (e.UserId == userId || e.UserId == null))
            .FirstOrDefaultAsync();
        
        if (exercise == null)
        {
            throw new KeyNotFoundException($"Exercise with ID {id} not found.");
        }

        return exercise;
    }

    public async Task<List<Exercise>> GetExercises(string userId)
    {
        // Fetch exercises that belong to the user or are system exercises (UserId is null)
        // Filter out deleted exercises and order by name
        return await _context.Exercises
            .Where(e => (e.UserId == userId || e.UserId == null) && !e.Deleted)
            .OrderBy(e => e.Name)
            .ToListAsync();
    }

    public async Task<Exercise> CreateUserExercise(string userId, string name)
    {
        if (string.IsNullOrWhiteSpace(name.Trim()))
        {
            throw new ArgumentException("Exercise name cannot be empty.");
        }
        
        // Check if an exercise with the same name already exists for the user or is a system exercise
        var exerciseExists = await _context.Exercises.Where(e =>
            e.Name.ToLower() == name.ToLower() && (e.UserId == userId || e.UserId == null)
        ).AnyAsync();

        if (exerciseExists)
        {
            throw new InvalidOperationException("An exercise with this name already exists.");
        }

        var newExercise = new Exercise
        {
            Name = name.Trim(),
            UserId = userId,
        };

        _context.Exercises.Add(newExercise);
        await _context.SaveChangesAsync();
        return  await GetExerciseById(newExercise.Id, userId);
    }
}