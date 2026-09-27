using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Workouts;
using WorkoutLogAPI.Enums;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.Tests.TestHelpers;

namespace WorkoutLogAPI.Tests.Services;

public class WorkoutServiceTests
{
    private static (WorkoutDbContext context, WorkoutService service) CreateSut()
    {
        var context = InMemoryDbContextFactory.Create();
        var service = new WorkoutService(context);
        return (context, service);
    }

    private static Exercise SeedExercise(WorkoutDbContext context, string name = "Bench Press")
    {
        var exercise = new Exercise { Name = name };
        context.Exercises.Add(exercise);
        context.SaveChanges();
        return exercise;
    }

    [Fact]
    public async Task CreateWorkout_WithValidData_PersistsWorkoutWithExercisesAndSets()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context);
        const string userId = "user-1";

        var dto = new WorkoutDto(
            Id: null,
            Title: "Push Day",
            UserId: userId,
            Date: new DateOnly(2026, 1, 1),
            Notes: "Felt strong",
            Exercises:
            [
                new WorkoutExerciseDto(
                    Id: null,
                    Notes: null,
                    WeightUnit: WeightUnit.Lbs,
                    ExerciseId: exercise.Id,
                    WorkoutId: null,
                    Exercise: null,
                    // Note: Set ExerciseId refers to WorkoutExercise Id which is not created yet
                    Sets: [new SetDto(null, 135, 5, 8, ExerciseId: 0)])
            ]);
        
        var result = await service.CreateWorkout(dto, userId);
        
        Assert.Equal("Push Day", result.Title);
        Assert.Single(result.Exercises);
        Assert.Single(result.Exercises.First().Sets);

        var savedWorkout = await context.Workouts.FindAsync(result.Id);
        Assert.NotNull(savedWorkout);
    }

    [Fact]
    public async Task CreateWorkout_WithDuplicateTitleAndDate_ThrowsInvalidOperationException()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var existingWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Leg Day",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1)
        };
        context.Workouts.Add(existingWorkout);
        await context.SaveChangesAsync();

        var duplicateDto = new WorkoutDto(
            Id: null,
            // Title comparison is case-insensitive in the service (ToLower()),
            // so deliberately vary the casing to prove that behavior is covered.
            Title: "LEG DAY",
            UserId: userId,
            Date: new DateOnly(2026, 1, 1),
            Notes: null,
            Exercises: null);
        
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateWorkout(duplicateDto, userId));

        Assert.Equal("A workout with this title and date already exists.", ex.Message);
    }
    
    [Fact]
    public async Task CreateWorkout_WithDuplicateTitleAndDateOfDeletedWorkout_AllowsCreation()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var deletedWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Leg Day",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            Deleted = true
        };
        context.Workouts.Add(deletedWorkout);
        await context.SaveChangesAsync();

        var dto = new WorkoutDto(
            Id: null,
            Title: "Leg Day",
            UserId: userId,
            Date: new DateOnly(2026, 1, 1),
            Notes: null,
            Exercises: null);
        
        var result = await service.CreateWorkout(dto, userId);
        
        Assert.Equal("Leg Day", result.Title);
        Assert.Equal(userId, result.UserId);
        Assert.Equal(new DateOnly(2026, 1, 1), result.Date);
    }

    [Fact]
    public async Task GetWorkoutById_WhenWorkoutDoesNotBelongToUser_ThrowsUnauthorizedAccessException()
    {
        var (context, service) = CreateSut();
        var workout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Someone Else's Workout",
            UserId = "owner-user",
            Date = new DateOnly(2026, 1, 1)
        };
        context.Workouts.Add(workout);
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => service.GetWorkoutById(workout.Id, "different-user"));
    }

    [Fact]
    public async Task UpdateWorkout_RemovingAnExercise_SoftDeletesRatherThanHardDeletes()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context);
        const string userId = "user-1";

        var created = await service.CreateWorkout(
            new WorkoutDto(null, "Push Day", userId, new DateOnly(2026, 1, 1), null,
            [
                new WorkoutExerciseDto(null, null, WeightUnit.Lbs, exercise.Id, null, null,
                    [new SetDto(null, 100, 10, null, ExerciseId: 0)])
            ]),
            userId);

        var createdExerciseId = created.Exercises.First().Id;
        var createdSetId = created.Exercises.First().Sets.First().Id;

        var updateDto = new WorkoutDto(created.Id, "Push Day", userId, new DateOnly(2026, 1, 1), null, []);
        var updated = await service.UpdateWorkout(created.Id, updateDto, userId);

        Assert.Empty(updated.Exercises);
        
        var exerciseRowStillExists = await context.WorkoutExercises
            .IgnoreQueryFilters() // in case global query filters are ever added later
            .AnyAsync(we => we.Id == createdExerciseId && we.Deleted);
        Assert.True(exerciseRowStillExists);

        // The set nested under the removed exercise must also be soft-deleted -
        // SyncExercises only marks the parent WorkoutExercise as deleted directly,
        // so this confirms child Sets aren't left behind as orphaned, non-deleted rows.
        var setRowStillExists = await context.Sets
            .IgnoreQueryFilters()
            .AnyAsync(s => s.Id == createdSetId && s.Deleted);
        Assert.True(setRowStillExists);
    }
    
    [Fact]
    public async Task UpdateWorkout_WithDuplicateTitleAndDate_ThrowsInvalidOperationException()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var existingWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Leg Day",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1)
        };
        context.Workouts.Add(existingWorkout);
        await context.SaveChangesAsync();

        var workoutToUpdate = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Push Day",
            UserId = userId,
            Date = new DateOnly(2026, 1, 2)
        };
        context.Workouts.Add(workoutToUpdate);
        await context.SaveChangesAsync();

        var updateDto = new WorkoutDto(
            Id: workoutToUpdate.Id,
            Title: "Leg Day",
            UserId: userId,
            Date: new DateOnly(2026, 1, 1),
            Notes: null,
            Exercises: null);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.UpdateWorkout(workoutToUpdate.Id, updateDto, userId));

        Assert.Equal("A workout with this title and date already exists.", ex.Message);
    }

    [Fact]
    public async Task DeleteWorkout_MarksWorkoutAsDeletedRatherThanRemovingRow()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var exercise = SeedExercise(context);
        var workout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Old Workout",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            Exercises = new List<WorkoutExercise>
            {
                new WorkoutExercise
                {
                    ExerciseId = exercise.Id,
                    WeightUnit = WeightUnit.Kg,
                    Sets = new List<Set>
                    {
                        new Set { Weight = 100, Reps = 5 },
                        new Set { Weight = 110, Reps = 3 }
                    }
                }
            }
        };
        context.Workouts.Add(workout);
        await context.SaveChangesAsync();

        await service.DeleteWorkout(workout.Id, userId);

        // GetWorkoutById filters out Deleted = true
        await Assert.ThrowsAsync<KeyNotFoundException>(() => service.GetWorkoutById(workout.Id, userId));
        
        var stillInDatabase = await context.Workouts
            .Include(w => w.Exercises)
            .ThenInclude(e => e.Sets)
            .FirstOrDefaultAsync(w => w.Id == workout.Id);
        
        var exercises = stillInDatabase!.Exercises;
        var sets = exercises.SelectMany(w => w.Sets).ToList();
        
        Assert.NotNull(stillInDatabase);
        Assert.True(stillInDatabase!.Deleted);
        Assert.NotEmpty(exercises);
        Assert.True(exercises.All(e => e.Deleted));
        Assert.NotEmpty(sets);
        Assert.True(sets.All(s => s.Deleted));
    }
    
    [Fact]
    public async Task HardDeleteUserWorkouts_WithValidUserId_DeletesAllWorkoutsAndRelatedEntities()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var exercise = SeedExercise(context);
        var workout1 = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Workout 1",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            Exercises = new List<WorkoutExercise>
            {
                new WorkoutExercise
                {
                    ExerciseId = exercise.Id,
                    WeightUnit = WeightUnit.Kg,
                    Sets = new List<Set>
                    {
                        new Set { Weight = 100, Reps = 5 },
                        new Set { Weight = 110, Reps = 3 }
                    }
                }
            }
        };
        var workout2 = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Workout 2",
            UserId = userId,
            Date = new DateOnly(2026, 1, 2),
            Exercises = new List<WorkoutExercise>
            {
                new WorkoutExercise
                {
                    ExerciseId = exercise.Id,
                    WeightUnit = WeightUnit.Lbs,
                    Sets = new List<Set>
                    {
                        new Set { Weight = 200, Reps = 5 },
                        new Set { Weight = 210, Reps = 3 }
                    }
                }
            }
        };
        
        context.Workouts.AddRange(workout1, workout2);
        await context.SaveChangesAsync();

        await service.HardDeleteUserWorkouts(userId);

        var remainingWorkouts = await context.Workouts.Where(w => w.UserId == userId).ToListAsync();
        Assert.Empty(remainingWorkouts);

        var remainingExercises = await context.WorkoutExercises.ToListAsync();
        Assert.Empty(remainingExercises);

        var remainingSets = await context.Sets.ToListAsync();
        Assert.Empty(remainingSets);
    }
}
