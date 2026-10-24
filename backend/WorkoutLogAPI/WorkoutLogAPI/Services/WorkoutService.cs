using WorkoutLogAPI.Data;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.DTOs.Workouts;
using WorkoutLogAPI.Exceptions;
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
            .Include(w => w.Exercises.Where(e => !e.Deleted).OrderBy(e => e.Id))
            .ThenInclude(e => e.Sets.Where(s => !s.Deleted).OrderBy(s => s.Id))
            .Include(w => w.Exercises.Where(e => !e.Deleted).OrderBy(e => e.Id))
            .ThenInclude(e => e.Exercise)
            .OrderBy(w => w.FinishedAt == null ? 0 : 1) // Unfinished workouts first
            .ThenByDescending(w => w.Date)
            .ToListAsync();
    }

    public async Task<Workout> GetWorkoutById(string id, string userId)
    {
        var workout = await _context.Workouts
            .Where(w => w.Id == id && !w.Deleted)
            .Include(w => w.Exercises.Where(e => !e.Deleted).OrderBy(e => e.Id))
            .ThenInclude(e => e.Sets.Where(s => !s.Deleted).OrderBy(s => s.Id))
            .Include(w => w.Exercises.Where(e => !e.Deleted).OrderBy(e => e.Id))
            .ThenInclude(e => e.Exercise)
            .FirstOrDefaultAsync();

        if (workout == null)
        {
            throw new KeyNotFoundException($"Workout with ID {id} not found.");
        }

        if (workout.UserId != userId)
        {
            throw new UnauthorizedAccessException($"User {userId} does not have access to workout with ID {id}.");
        }

        return workout;
    }
    
    // Fetches the active workout for a user, which is defined as a workout that has not been marked as finished
    public async Task<Workout?> GetActiveWorkout(string userId)
    {
        return await _context.Workouts
            .Where(w => w.UserId == userId && !w.Deleted && w.FinishedAt == null)
            .Include(w => w.Exercises.Where(e => !e.Deleted).OrderBy(e => e.Id))
            .ThenInclude(e => e.Sets.Where(s => !s.Deleted).OrderBy(s => s.Id))
            .Include(w => w.Exercises.Where(e => !e.Deleted).OrderBy(e => e.Id))
            .ThenInclude(e => e.Exercise)
            .FirstOrDefaultAsync();
    }

    // Fetches the history of a specific exercise for a user, including all workouts and sets associated with that exercise.
    public async Task<List<WorkoutExercise>> GetExerciseHistory(int exerciseId, string userId)
    {
        return await _context.WorkoutExercises
            .Where(we => we.ExerciseId == exerciseId && !we.Deleted && we.Workout.UserId == userId &&
                         !we.Workout.Deleted)
            .Include(we => we.Workout)
            .Include(we => we.Sets.Where(s => !s.Deleted).OrderBy(s => s.Id))
            .OrderByDescending(we => we.Workout.Date)
            .ToListAsync();
    }

    public async Task<Workout> CreateWorkout(WorkoutDto workoutDto, string userId)
    {
        var hasUnfinishedWorkout =
            await _context.Workouts.AnyAsync(w => w.UserId == userId && !w.Deleted && w.FinishedAt == null);
        
        if (hasUnfinishedWorkout)
        {
            throw new ActiveWorkoutExistsException("You already have an unfinished workout. Please finish it before creating a new one.");
        }
        
        var workoutExists = await _context.Workouts.Where(w =>
                w.Title.ToLower() == workoutDto.Title.ToLower() &&
                w.Date == workoutDto.Date &&
                w.UserId == userId &&
                !w.Deleted)
            .AnyAsync();

        if (workoutExists)
        {
            throw new DuplicateWorkoutException("A workout with this title and date already exists.");
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
                    EffortType = e.EffortType,
                    ExerciseId = e.ExerciseId,
                    Sets = e.Sets?.Select(s => new Set
                    {
                        Weight = s.Weight,
                        Reps = s.Reps,
                        EffortRating = s.EffortRating,
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

        // Check if a workout with the same title and date already exists for this user, excluding the current workout
        var workoutExists = await _context.Workouts.Where(w =>
                w.Title.ToLower() == workoutDto.Title.ToLower() &&
                w.Date == workoutDto.Date &&
                w.UserId == userId &&
                !w.Deleted &&
                w.Id != id)
            .AnyAsync();

        if (workoutExists)
        {
            throw new DuplicateWorkoutException("A workout with this title and date already exists.");
        }

        // Update the top-level properties of the workout
        workout.Title = workoutDto.Title;
        workout.Date = workoutDto.Date;
        workout.Notes = workoutDto.Notes;

        // Add, update, or soft delete exercises and sets based on the provided DTO
        SyncExercises(workout, workoutDto.Exercises);
        
        if (workout.FinishedAt == null)
        {
            // If the workout is unfinished, we hard-delete any exercises/sets that were removed in the update request.
            PurgeDeletedExercisesAndSets(workout, _context);
        }

        await _context.SaveChangesAsync();

        // We just soft-deleted some exercises/sets in memory above. EF Core keeps
        // entities it has already loaded, so if we reloaded the workout right now,
        // it would still show those deleted items in the Exercises/Sets lists even
        // though the database (and a fresh query) would exclude them. Clearing the
        // tracker forgets everything this request has loaded so far, forcing the
        // reload below to rebuild the workout from scratch using only what's
        // actually in the database.
        _context.ChangeTracker.Clear();

        return await GetWorkoutById(workout.Id, userId);
    }
    
    public async Task FinishWorkout(string id, string userId)
    {
        var workout = await GetWorkoutById(id, userId);
        
        if (workout.FinishedAt != null)
        {
            throw new InvalidOperationException("This workout has already been finished.");
        }
        
        workout.FinishedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteWorkout(string id, string userId)
    {
        var workout = await GetWorkoutById(id, userId);

        if (workout.FinishedAt == null)
        {
            // Unfinished workouts have no history worth preserving, so remove them outright.
            HardDeleteWorkout(workout, _context);
        }
        else
        {
            workout.Deleted = true;

            // Soft-delete all exercises and sets associated with the workout
            foreach (var exercise in workout.Exercises)
            {
                exercise.Deleted = true;

                foreach (var set in exercise.Sets)
                {
                    set.Deleted = true;
                }
            }
        }

        await _context.SaveChangesAsync();
    }
    
    // Hard delete a given user's workouts and all associated exercises and sets from the database.
    // Primarily used for cleaning up Playwright test workouts.
    public async Task HardDeleteUserWorkouts(string userId)
    {
        var workouts = await _context.Workouts
            .Include(w => w.Exercises)
            .ThenInclude(e => e.Sets)
            .Where(w => w.UserId == userId).ToListAsync();
        
        // If there are no workouts for the user, there's nothing to delete.
        if (workouts.Count == 0)
        {
            return;
        }

        var sets = workouts.SelectMany(w => w.Exercises).SelectMany(e => e.Sets).ToList();
        var exercises = workouts.SelectMany(w => w.Exercises).ToList();
        
        // Due to foreign key constraints, we need to delete the sets, then workout exercises, then workouts.
        _context.Sets.RemoveRange(sets);
        _context.WorkoutExercises.RemoveRange(exercises);
        _context.Workouts.RemoveRange(workouts);
        await _context.SaveChangesAsync();
    }

    private static void SyncExercises(Workout workout, List<WorkoutExerciseDto>? exerciseDtos)
    {
        var updatedExerciseIds = exerciseDtos?.Select(e => e.Id).ToList() ?? new List<int?>();

        // Mark exercises missing from the update request as deleted, along with
        // their sets, so a removed exercise doesn't leave orphaned, non-deleted
        // set rows behind.
        foreach (var exercise in workout.Exercises.Where(e => !updatedExerciseIds.Contains(e.Id)))
        {
            exercise.Deleted = true;

            foreach (var set in exercise.Sets)
            {
                set.Deleted = true;
            }
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
                existingExercise.EffortType = exerciseDto.EffortType;

                SyncSets(existingExercise, exerciseDto.Sets);
            }
            else
            {
                workout.Exercises.Add(new WorkoutExercise
                {
                    Notes = exerciseDto.Notes,
                    WeightUnit = exerciseDto.WeightUnit,
                    EffortType = exerciseDto.EffortType,
                    ExerciseId = exerciseDto.ExerciseId,
                    Sets = exerciseDto.Sets?
                        .Select(s => new Set
                        {
                            Weight = s.Weight,
                            Reps = s.Reps,
                            EffortRating = s.EffortRating,
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
            // Unsaved sets are submitted with Id 0 (or null). Treat those as always-new:
            // matching on Id 0/null here would make a second new set in the same request
            // match the first new set's not-yet-saved entity (both still have Id 0 before
            // SaveChanges), overwriting it instead of being added as its own set.
            var existingSet = setDto.Id is > 0
                ? existingExercise.Sets.FirstOrDefault(s => s.Id == setDto.Id)
                : null;

            if (existingSet != null)
            {
                existingSet.Weight = setDto.Weight;
                existingSet.Reps = setDto.Reps;
                existingSet.EffortRating = setDto.EffortRating;
            }
            else
            {
                existingExercise.Sets.Add(new Set
                {
                    Weight = setDto.Weight,
                    Reps = setDto.Reps,
                    EffortRating = setDto.EffortRating,
                });
            }
        }
    }
    
    // After autosave was implemented, it no longer makes sense to soft delete exercises and sets when an *unfinished* workout is updated.
    // This method is called on update *only* if the workout is unfinished. Updating a finished workout will soft-delete.
    private static void PurgeDeletedExercisesAndSets(Workout workout, WorkoutDbContext context)
    {
        var deletedSets = workout.Exercises.SelectMany(e => e.Sets).Where(s => s.Deleted).ToList();
        var deletedExercises = workout.Exercises.Where(e => e.Deleted).ToList();
        
        context.Sets.RemoveRange(deletedSets);
        context.WorkoutExercises.RemoveRange(deletedExercises);
    }
    
    // Hard delete a workout and all associated exercises and sets from the database. Called conditionally when deleting an unfinished workout.
    private static void HardDeleteWorkout(Workout workout, WorkoutDbContext context)
    {
        var sets = workout.Exercises.SelectMany(e => e.Sets).ToList();
        var exercises = workout.Exercises.ToList();
        
        context.Sets.RemoveRange(sets);
        context.WorkoutExercises.RemoveRange(exercises);
        context.Workouts.Remove(workout);
    }
}