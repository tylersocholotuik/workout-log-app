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
    
    public async Task<Workout> UpdateWorkout(string id, WorkoutDto workoutDto, string userId)
    {
        var workout = await GetWorkoutById(id, userId);

        // Update the top-level properties of the workout
        workout.Title = workoutDto.Title;
        workout.Date = workoutDto.Date;
        workout.Notes = workoutDto.Notes;

        SyncExercises(workout, workoutDto.Exercises);

        await _context.SaveChangesAsync();
        
        _context.ChangeTracker.Clear();

        return await GetWorkoutById(workout.Id, userId);
    }
    
    public async Task DeleteWorkout(string id, string userId)
    {
        var workout = await GetWorkoutById(id, userId);
        workout.Deleted = true;
        await _context.SaveChangesAsync();
    }

    private static void SyncExercises(Workout workout, List<WorkoutExerciseDto>? exerciseDtos)
    {
        var updatedExerciseIds = exerciseDtos?.Select(e => e.Id).ToList() ?? new List<int?>();

        // Mark exercises missing from the update request as deleted
        foreach (var exercise in workout.Exercises.Where(e => !updatedExerciseIds.Contains(e.Id)))
        {
            exercise.Deleted = true;
        }

        if (exerciseDtos == null)
        {
            return;
        }

        foreach (var exerciseDto in exerciseDtos)
        {
            var existingExercise = workout.Exercises.FirstOrDefault(e => e.Id == exerciseDto.Id);

            if (existingExercise != null)
            {
                existingExercise.ExerciseId = exerciseDto.ExerciseId;
                existingExercise.Notes = exerciseDto.Notes;
                existingExercise.WeightUnit = exerciseDto.WeightUnit;

                SyncSets(existingExercise, exerciseDto.Sets);
            }
            else
            {
                workout.Exercises.Add(new WorkoutExercise
                {
                    Notes = exerciseDto.Notes,
                    WeightUnit = exerciseDto.WeightUnit,
                    ExerciseId = exerciseDto.ExerciseId,
                    Sets = exerciseDto.Sets?
                        .Select(s => new Set
                        {
                            Weight = s.Weight,
                            Reps = s.Reps,
                            Rpe = s.Rpe,
                        }).ToList() ?? new List<Set>(),
                });
            }
        }
    }

    private static void SyncSets(WorkoutExercise existingExercise, List<SetDto>? setDtos)
    {
        var updatedSetIds = setDtos?.Select(s => s.Id).ToList() ?? new List<int?>();

        // Mark sets missing from the update request as deleted
        foreach (var set in existingExercise.Sets.Where(s => !updatedSetIds.Contains(s.Id)))
        {
            set.Deleted = true;
        }

        if (setDtos == null)
        {
            return;
        }

        foreach (var setDto in setDtos)
        {
            var existingSet = existingExercise.Sets.FirstOrDefault(s => s.Id == setDto.Id);

            if (existingSet != null)
            {
                existingSet.Weight = setDto.Weight;
                existingSet.Reps = setDto.Reps;
                existingSet.Rpe = setDto.Rpe;
            }
            else
            {
                existingExercise.Sets.Add(new Set
                {
                    Weight = setDto.Weight,
                    Reps = setDto.Reps,
                    Rpe = setDto.Rpe,
                });
            }
        }
    }
}