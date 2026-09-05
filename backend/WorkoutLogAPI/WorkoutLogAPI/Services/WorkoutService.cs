using WorkoutLogAPI.Data;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.DTOs;
using Microsoft.EntityFrameworkCore;

namespace WorkoutLogAPI.Services;

public class WorkoutService
{
    private readonly WorkoutDbContext _context;

    public WorkoutService(WorkoutDbContext context)
    {
        _context = context;
    }

    public async Task<List<Workout>> GetUserWorkouts(string userId)
    {
        return await _context.Workouts
            .Where(w => w.UserId == userId && !w.Deleted)
            .Include(w => w.Exercises.Where(e => !e.Deleted))
                .ThenInclude(e => e.Sets.Where(s => !s.Deleted))
            .Include(w => w.Exercises.Where(e => !e.Deleted))
                .ThenInclude(e => e.Exercise)
            .OrderByDescending(w => w.Date)
            .ToListAsync();
    }

    public async Task<Workout> GetWorkoutById(string id, string userId)
    {
        var workout = await _context.Workouts
            .Where(w => w.Id == id && w.UserId == userId && !w.Deleted)
            .Include(w => w.Exercises.Where(e => !e.Deleted))
                .ThenInclude(e => e.Sets.Where(s => !s.Deleted))
            .Include(w => w.Exercises.Where(e => !e.Deleted))
                .ThenInclude(e => e.Exercise)
            .FirstOrDefaultAsync();

        if (workout == null)
        {
            throw new KeyNotFoundException($"Workout with ID {id} not found.");
        }

        return workout;
    }

    public async Task<Workout> CreateWorkout(WorkoutDto workoutDto, string userId)
    {
        var workoutExists = await _context.Workouts.Where(w =>
                w.Title.ToLower() == workoutDto.Title.ToLower() && w.Date == workoutDto.Date && w.UserId == userId)
            .AnyAsync();

        if (workoutExists)
        {
            throw new InvalidOperationException("A workout with this title and date already exists.");
        }

        var workout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = workoutDto.Title,
            UserId = userId,
            Date = workoutDto.Date,
            Notes = workoutDto.Notes,
            Exercises = workoutDto.Exercises?
                .Select(e => new WorkoutExercise
                {
                    Notes = e.Notes,
                    WeightUnit = e.WeightUnit,
                    ExerciseId = e.ExerciseId,
                    WorkoutId = e.WorkoutId,
                    Sets = e.Sets?.Select(s => new Set
                    {
                        Weight = s.Weight,
                        Reps = s.Reps,
                        Rpe = s.Rpe,
                    }).ToList() ?? new List<Set>(),
                }).ToList() ?? new List<WorkoutExercise>(),
        };
        _context.Workouts.Add(workout);
        await _context.SaveChangesAsync();
        return await GetWorkoutById(workout.Id, userId);
    }
}