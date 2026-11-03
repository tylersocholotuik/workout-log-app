using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.DTOs.Workouts;
using WorkoutLogAPI.Enums;
using WorkoutLogAPI.Exceptions;
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

    private static Exercise SeedExercise(
        WorkoutDbContext context, string name = "Bench Press", ExerciseType exerciseType = ExerciseType.Reps)
    {
        var exercise = new Exercise { Name = name, ExerciseType = exerciseType };
        context.Exercises.Add(exercise);
        context.SaveChanges();
        return exercise;
    }

    // Builds a minimal valid WorkoutDto with a single exercise/set, letting callers override
    // just the fields relevant to the validation rule under test.
    private static WorkoutDto BuildWorkoutDto(
        string userId,
        int exerciseId,
        WeightUnit? weightUnit = null,
        DistanceUnit? distanceUnit = null,
        EffortRatingType effortType = EffortRatingType.Rpe,
        SetDto? set = null) =>
        new(
            Id: null,
            Title: "Push Day",
            UserId: userId,
            Date: new DateOnly(2026, 1, 1),
            Notes: null,
            Exercises:
            [
                new WorkoutExerciseDto(
                    Id: null,
                    Notes: null,
                    WeightUnit: weightUnit,
                    DistanceUnit: distanceUnit,
                    EffortType: effortType,
                    ExerciseId: exerciseId,
                    WorkoutId: null,
                    Exercise: null,
                    Sets: [set ?? new SetDto(Id: null, Weight: 135, Reps: 5, EffortRating: 8, ExerciseId: 0)])
            ]);

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
                    DistanceUnit: null,
                    EffortType: EffortRatingType.Rpe,
                    ExerciseId: exercise.Id,
                    WorkoutId: null,
                    Exercise: null,
                    // Note: Set ExerciseId refers to WorkoutExercise Id which is not created yet
                    Sets: [new SetDto(Id: null, Weight: 135, Reps: 5, EffortRating: 8, ExerciseId: 0)])
            ]);
        
        var result = await service.CreateWorkout(dto, userId);
        
        Assert.Equal("Push Day", result.Title);
        Assert.Single(result.Exercises);
        Assert.Single(result.Exercises.First().Sets);

        var savedWorkout = await context.Workouts.FindAsync(result.Id);
        Assert.NotNull(savedWorkout);
    }

    [Fact]
    public async Task CreateWorkout_WithRirEffortType_PersistsWorkoutWithExercisesAndSets()
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
                    DistanceUnit: null,
                    EffortType: EffortRatingType.Rir,
                    ExerciseId: exercise.Id,
                    WorkoutId: null,
                    Exercise: null,
                    // Note: Set ExerciseId refers to WorkoutExercise Id which is not created yet
                    Sets: [new SetDto(Id: null, Weight: 135, Reps: 5, EffortRating: 2, ExerciseId: 0)])
            ]);

        var result = await service.CreateWorkout(dto, userId);

        Assert.Equal(EffortRatingType.Rir, result.Exercises.First().EffortType);
        Assert.Equal(2, result.Exercises.First().Sets.First().EffortRating);

        var savedWorkout = await context.Workouts.FindAsync(result.Id);
        Assert.NotNull(savedWorkout);
    }

    [Fact]
    public async Task CreateWorkout_WithDuplicateTitleAndDate_ThrowsDuplicateWorkoutException()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var existingWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Leg Day",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = DateTime.UtcNow
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
        
        var ex = await Assert.ThrowsAsync<DuplicateWorkoutException>(
            () => service.CreateWorkout(duplicateDto, userId));

        Assert.Equal("A workout with this title and date already exists.", ex.Message);
    }

    [Fact]
    public async Task CreateWorkout_WhenUserHasAnUnfinishedWorkout_ThrowsActiveWorkoutExistsException()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var activeWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "In Progress",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = null
        };
        context.Workouts.Add(activeWorkout);
        await context.SaveChangesAsync();

        var dto = new WorkoutDto(
            Id: null,
            Title: "Another Workout",
            UserId: userId,
            Date: new DateOnly(2026, 1, 2),
            Notes: null,
            Exercises: null);

        var ex = await Assert.ThrowsAsync<ActiveWorkoutExistsException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Equal(
            "You already have an unfinished workout. Please finish it before creating a new one.",
            ex.Message);
    }

    [Fact]
    public async Task CreateWorkout_WhenAnotherUserHasAnUnfinishedWorkout_StillAllowsCreation()
    {
        var (context, service) = CreateSut();
        var otherUsersActiveWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Someone Else's In Progress Workout",
            UserId = "other-user",
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = null
        };
        context.Workouts.Add(otherUsersActiveWorkout);
        await context.SaveChangesAsync();

        var dto = new WorkoutDto(
            Id: null,
            Title: "My Workout",
            UserId: "user-1",
            Date: new DateOnly(2026, 1, 2),
            Notes: null,
            Exercises: null);

        var result = await service.CreateWorkout(dto, "user-1");

        Assert.Equal("My Workout", result.Title);
    }

    [Fact]
    public async Task CreateWorkout_WhenUsersOnlyExistingWorkoutIsFinished_AllowsCreation()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var finishedWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Done Already",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = DateTime.UtcNow
        };
        context.Workouts.Add(finishedWorkout);
        await context.SaveChangesAsync();

        var dto = new WorkoutDto(
            Id: null,
            Title: "New Workout",
            UserId: userId,
            Date: new DateOnly(2026, 1, 2),
            Notes: null,
            Exercises: null);

        var result = await service.CreateWorkout(dto, userId);

        Assert.Equal("New Workout", result.Title);
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
    public async Task UpdateWorkout_RemovingAnExercise_OnUnfinishedWorkout_HardDeletesExerciseAndSets()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context);
        const string userId = "user-1";

        // CreateWorkout leaves FinishedAt null, so this workout is unfinished.
        var created = await service.CreateWorkout(
            new WorkoutDto(null, "Push Day", userId, new DateOnly(2026, 1, 1), null,
            [
                new WorkoutExerciseDto(null, null, WeightUnit.Lbs, null, EffortRatingType.Rpe, exercise.Id, null, null,
                    [new SetDto(Id: null, Weight: 100, Reps: 10, EffortRating: null, ExerciseId: 0)])
            ]),
            userId);

        var createdExerciseId = created.Exercises.First().Id;
        var createdSetId = created.Exercises.First().Sets.First().Id;

        var updateDto = new WorkoutDto(created.Id, "Push Day", userId, new DateOnly(2026, 1, 1), null, []);
        var updated = await service.UpdateWorkout(created.Id, updateDto, userId);

        Assert.Empty(updated.Exercises);

        // Removing an exercise from an unfinished workout should hard-delete the
        // row entirely rather than leaving a soft-deleted row behind, since
        // unfinished workouts have no history worth preserving.
        var exerciseRowStillExists = await context.WorkoutExercises
            .IgnoreQueryFilters()
            .AnyAsync(we => we.Id == createdExerciseId);
        Assert.False(exerciseRowStillExists);

        // The set nested under the removed exercise must also be hard-deleted.
        var setRowStillExists = await context.Sets
            .IgnoreQueryFilters()
            .AnyAsync(s => s.Id == createdSetId);
        Assert.False(setRowStillExists);
    }

    [Fact]
    public async Task UpdateWorkout_RemovingAnExercise_OnFinishedWorkout_SoftDeletesExerciseAndSets()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context);
        const string userId = "user-1";

        var created = await service.CreateWorkout(
            new WorkoutDto(null, "Push Day", userId, new DateOnly(2026, 1, 1), null,
            [
                new WorkoutExerciseDto(null, null, WeightUnit.Lbs, null, EffortRatingType.Rpe, exercise.Id, null, null,
                    [new SetDto(Id: null, Weight: 100, Reps: 10, EffortRating: null, ExerciseId: 0)])
            ]),
            userId);

        await service.FinishWorkout(created.Id, userId);

        var createdExerciseId = created.Exercises.First().Id;
        var createdSetId = created.Exercises.First().Sets.First().Id;

        var updateDto = new WorkoutDto(created.Id, "Push Day", userId, new DateOnly(2026, 1, 1), null, []);
        var updated = await service.UpdateWorkout(created.Id, updateDto, userId);

        Assert.Empty(updated.Exercises);

        // Once a workout is finished, removing an exercise should soft-delete it
        // rather than hard-delete it, preserving the finished workout's history.
        var exerciseRowStillExists = await context.WorkoutExercises
            .IgnoreQueryFilters()
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
    public async Task UpdateWorkout_RemovingASet_OnUnfinishedWorkout_HardDeletesSetButKeepsExercise()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context);
        const string userId = "user-1";

        var created = await service.CreateWorkout(
            new WorkoutDto(null, "Push Day", userId, new DateOnly(2026, 1, 1), null,
            [
                new WorkoutExerciseDto(null, null, WeightUnit.Lbs, null, EffortRatingType.Rpe, exercise.Id, null, null,
                [
                    new SetDto(Id: null, Weight: 100, Reps: 10, EffortRating: null, ExerciseId: 0),
                    new SetDto(Id: null, Weight: 110, Reps: 8, EffortRating: null, ExerciseId: 0)
                ])
            ]),
            userId);

        var createdExercise = created.Exercises.First();
        var keptSetId = createdExercise.Sets.First().Id;
        var removedSetId = createdExercise.Sets.Last().Id;

        var updateDto = new WorkoutDto(created.Id, "Push Day", userId, new DateOnly(2026, 1, 1), null,
        [
            new WorkoutExerciseDto(createdExercise.Id, null, WeightUnit.Lbs, null, EffortRatingType.Rpe, exercise.Id, null, null,
                [new SetDto(Id: keptSetId, Weight: 100, Reps: 10, EffortRating: null, ExerciseId: 0)])
        ]);
        await service.UpdateWorkout(created.Id, updateDto, userId);

        // The exercise itself is still present in the update request, so it must remain.
        var exerciseRowStillExists = await context.WorkoutExercises
            .IgnoreQueryFilters()
            .AnyAsync(we => we.Id == createdExercise.Id);
        Assert.True(exerciseRowStillExists);

        // The removed set should be hard-deleted, not just marked deleted.
        var removedSetRowStillExists = await context.Sets
            .IgnoreQueryFilters()
            .AnyAsync(s => s.Id == removedSetId);
        Assert.False(removedSetRowStillExists);
    }
    
    [Fact]
    public async Task UpdateWorkout_WithDuplicateTitleAndDate_ThrowsDuplicateWorkoutException()
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

        var ex = await Assert.ThrowsAsync<DuplicateWorkoutException>(
            () => service.UpdateWorkout(workoutToUpdate.Id, updateDto, userId));

        Assert.Equal("A workout with this title and date already exists.", ex.Message);
    }

    [Fact]
    public async Task GetActiveWorkout_WhenUserHasAnUnfinishedWorkout_ReturnsIt()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var activeWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "In Progress",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = null
        };
        context.Workouts.Add(activeWorkout);
        await context.SaveChangesAsync();

        var result = await service.GetActiveWorkout(userId);

        Assert.NotNull(result);
        Assert.Equal(activeWorkout.Id, result!.Id);
    }

    [Fact]
    public async Task GetActiveWorkout_WhenUsersOnlyWorkoutIsFinished_ReturnsNull()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var finishedWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Done",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = DateTime.UtcNow
        };
        context.Workouts.Add(finishedWorkout);
        await context.SaveChangesAsync();

        var result = await service.GetActiveWorkout(userId);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetActiveWorkout_WhenUserHasNoWorkouts_ReturnsNull()
    {
        var (_, service) = CreateSut();

        var result = await service.GetActiveWorkout("user-1");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetActiveWorkout_IgnoresOtherUsersUnfinishedWorkouts()
    {
        var (context, service) = CreateSut();
        var otherUsersActiveWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Not Mine",
            UserId = "other-user",
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = null
        };
        context.Workouts.Add(otherUsersActiveWorkout);
        await context.SaveChangesAsync();

        var result = await service.GetActiveWorkout("user-1");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetActiveWorkout_IgnoresDeletedUnfinishedWorkouts()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var deletedActiveWorkout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Deleted But Unfinished",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = null,
            Deleted = true
        };
        context.Workouts.Add(deletedActiveWorkout);
        await context.SaveChangesAsync();

        var result = await service.GetActiveWorkout(userId);

        Assert.Null(result);
    }

    [Fact]
    public async Task FinishWorkout_WithValidId_SetsFinishedAt()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var workout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "In Progress",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1)
        };
        context.Workouts.Add(workout);
        await context.SaveChangesAsync();

        await service.FinishWorkout(workout.Id, userId);

        var updated = await context.Workouts.FindAsync(workout.Id);
        Assert.NotNull(updated!.FinishedAt);
    }

    [Fact]
    public async Task FinishWorkout_WhenAlreadyFinished_ThrowsInvalidOperationException()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var workout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Already Done",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = DateTime.UtcNow
        };
        context.Workouts.Add(workout);
        await context.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.FinishWorkout(workout.Id, userId));

        Assert.Equal("This workout has already been finished.", ex.Message);
        // The exception should be the base type here rather than one of the
        // Create-specific subclasses, since this isn't a workout-creation conflict.
        Assert.IsType<InvalidOperationException>(ex);
    }

    [Fact]
    public async Task FinishWorkout_WithNonexistentId_ThrowsKeyNotFoundException()
    {
        var (_, service) = CreateSut();

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => service.FinishWorkout(Guid.NewGuid().ToString(), "user-1"));
    }

    [Fact]
    public async Task FinishWorkout_WhenWorkoutDoesNotBelongToUser_ThrowsUnauthorizedAccessException()
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
            () => service.FinishWorkout(workout.Id, "different-user"));
    }

    [Fact]
    public async Task DeleteWorkout_WhenFinished_MarksWorkoutAsDeletedRatherThanRemovingRow()
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
            FinishedAt = DateTime.UtcNow,
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
            .IgnoreQueryFilters()
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
    public async Task DeleteWorkout_WhenUnfinished_HardDeletesWorkoutAndRelatedEntities()
    {
        var (context, service) = CreateSut();
        const string userId = "user-1";
        var exercise = SeedExercise(context);
        var workout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "In Progress Workout",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            FinishedAt = null,
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

        var exerciseId = workout.Exercises.First().Id;
        var setIds = workout.Exercises.First().Sets.Select(s => s.Id).ToList();

        await service.DeleteWorkout(workout.Id, userId);

        // Unfinished workouts have no history worth preserving, so the workout,
        // its exercises, and its sets should be hard-deleted rather than
        // left behind as soft-deleted rows.
        var workoutRowStillExists = await context.Workouts
            .IgnoreQueryFilters()
            .AnyAsync(w => w.Id == workout.Id);
        Assert.False(workoutRowStillExists);

        var exerciseRowStillExists = await context.WorkoutExercises
            .IgnoreQueryFilters()
            .AnyAsync(we => we.Id == exerciseId);
        Assert.False(exerciseRowStillExists);

        var anySetRowsStillExist = await context.Sets
            .IgnoreQueryFilters()
            .AnyAsync(s => setIds.Contains(s.Id));
        Assert.False(anySetRowsStillExist);
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

    #region GetExerciseAndSetValidationErrors (via CreateWorkout/UpdateWorkout)

    [Fact]
    public async Task CreateWorkout_WithNonexistentExerciseId_ThrowsWorkoutValidationExceptionAndSkipsFurtherChecksForThatExercise()
    {
        var (_, service) = CreateSut();
        const string userId = "user-1";
        const int nonexistentExerciseId = 999999;

        var dto = BuildWorkoutDto(userId, nonexistentExerciseId, weightUnit: WeightUnit.Lbs);

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        var errorKey = Assert.Single(ex.Errors.Keys);
        Assert.Equal("Exercises[0]", errorKey);
        Assert.Contains($"Exercise with ID {nonexistentExerciseId} does not exist.", ex.Errors[errorKey]);
    }

    [Fact]
    public async Task CreateWorkout_WithoutWeightUnitOrDistanceUnit_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(userId, exercise.Id, weightUnit: null, distanceUnit: null);

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Exercise '{exercise.Name}' must have either a weight unit or a distance unit specified.",
            ex.Errors["Exercises[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithRepsExerciseAndDistanceUnit_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Reps);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(userId, exercise.Id, weightUnit: WeightUnit.Lbs, distanceUnit: DistanceUnit.Kilometers);

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Exercise '{exercise.Name}' is of type 'Reps' and should not have a distance unit specified.",
            ex.Errors["Exercises[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithTimeExerciseAndDistanceUnit_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Time);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs, distanceUnit: DistanceUnit.Kilometers,
            set: new SetDto(Id: null, Weight: 50, Reps: null, EffortRating: 8, ExerciseId: 0, DurationSeconds: 60));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Exercise '{exercise.Name}' is of type 'Time' and should not have a distance unit specified.",
            ex.Errors["Exercises[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithCardioExerciseAndWeightUnit_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Cardio);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs, distanceUnit: DistanceUnit.Kilometers,
            set: new SetDto(Id: null, Weight: null, Reps: null, EffortRating: 8, ExerciseId: 0, Distance: 5, DurationSeconds: 1200));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Exercise '{exercise.Name}' is of type 'Cardio' and should not have a weight unit specified.",
            ex.Errors["Exercises[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithRepsExerciseAndSetHavingDistanceOrDuration_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Reps);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs,
            set: new SetDto(Id: null, Weight: 135, Reps: 5, EffortRating: 8, ExerciseId: 0, DurationSeconds: 30));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        var errorKey = Assert.Single(ex.Errors.Keys);
        Assert.Equal("Exercises[0].Sets[0]", errorKey);
        Assert.Contains(
            $"Set 1 of exercise '{exercise.Name}' is of type 'Reps' and should not have distance or duration values specified.",
            ex.Errors[errorKey]);
    }

    [Fact]
    public async Task CreateWorkout_WithTimeExerciseAndSetHavingReps_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Time);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs,
            set: new SetDto(Id: null, Weight: 50, Reps: 5, EffortRating: 8, ExerciseId: 0, DurationSeconds: 60));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Set 1 of exercise '{exercise.Name}' is of type 'Time' and should not have distance or reps values specified.",
            ex.Errors["Exercises[0].Sets[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithCardioExerciseAndSetHavingWeightOrReps_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Cardio);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, distanceUnit: DistanceUnit.Kilometers,
            set: new SetDto(Id: null, Weight: 10, Reps: null, EffortRating: 8, ExerciseId: 0, Distance: 5, DurationSeconds: 1200));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Set 1 of exercise '{exercise.Name}' is of type 'Cardio' and should not have weight or reps values specified.",
            ex.Errors["Exercises[0].Sets[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithRirEffortTypeOnTimeExerciseSet_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Time);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs, effortType: EffortRatingType.Rir,
            set: new SetDto(Id: null, Weight: 50, Reps: null, EffortRating: 2, ExerciseId: 0, DurationSeconds: 60));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Set 1 of exercise '{exercise.Name}' is of type 'Time' and should not have an RIR effort rating or target effort values specified.",
            ex.Errors["Exercises[0].Sets[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithRirEffortTypeOnCardioExerciseSet_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Cardio);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, distanceUnit: DistanceUnit.Kilometers, effortType: EffortRatingType.Rir,
            set: new SetDto(Id: null, Weight: null, Reps: null, EffortRating: 2, ExerciseId: 0, Distance: 5, DurationSeconds: 1200));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Set 1 of exercise '{exercise.Name}' is of type 'Cardio' and should not have an RIR effort rating or target effort values specified.",
            ex.Errors["Exercises[0].Sets[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithValidTimeExercise_PersistsWorkoutWithExercisesAndSets()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Time);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs,
            set: new SetDto(
                Id: null, Weight: 50, Reps: null, EffortRating: 8, ExerciseId: 0,
                DurationSeconds: 60, TargetSecondsMin: 45, TargetSecondsMax: 90));

        var result = await service.CreateWorkout(dto, userId);

        Assert.Single(result.Exercises);
        var set = Assert.Single(result.Exercises.First().Sets);
        Assert.Equal(60, set.DurationSeconds);
    }

    [Fact]
    public async Task CreateWorkout_WithValidCardioExercise_PersistsWorkoutWithExercisesAndSets()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Cardio);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, distanceUnit: DistanceUnit.Kilometers,
            set: new SetDto(
                Id: null, Weight: null, Reps: null, EffortRating: 8, ExerciseId: 0,
                Distance: 5.2, DurationSeconds: 1500));

        var result = await service.CreateWorkout(dto, userId);

        Assert.Single(result.Exercises);
        var set = Assert.Single(result.Exercises.First().Sets);
        Assert.Equal(5.2, set.Distance);
        Assert.Equal(1500, set.DurationSeconds);
    }

    [Fact]
    public async Task CreateWorkout_WithDistanceExerciseAndOnlyWeightUnit_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Distance);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs, distanceUnit: null,
            set: new SetDto(Id: null, Weight: 50, Reps: null, EffortRating: 8, ExerciseId: 0, Distance: 100));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Exercise '{exercise.Name}' is of type 'Distance' and must have both a weight unit and a distance unit specified.",
            ex.Errors["Exercises[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithDistanceExerciseAndOnlyDistanceUnit_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Distance);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: null, distanceUnit: DistanceUnit.Meters,
            set: new SetDto(Id: null, Weight: null, Reps: null, EffortRating: 8, ExerciseId: 0, Distance: 100));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Exercise '{exercise.Name}' is of type 'Distance' and must have both a weight unit and a distance unit specified.",
            ex.Errors["Exercises[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithDistanceExerciseAndSetHavingDurationOrReps_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Distance);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs, distanceUnit: DistanceUnit.Meters,
            set: new SetDto(Id: null, Weight: 50, Reps: null, EffortRating: 8, ExerciseId: 0, Distance: 100, DurationSeconds: 60));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Set 1 of exercise '{exercise.Name}' is of type 'Distance' and should not have duration or reps values specified.",
            ex.Errors["Exercises[0].Sets[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithRirEffortTypeOnDistanceExerciseSet_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Distance);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs, distanceUnit: DistanceUnit.Meters,
            effortType: EffortRatingType.Rir,
            set: new SetDto(Id: null, Weight: 50, Reps: null, EffortRating: 2, ExerciseId: 0, Distance: 100));

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Contains(
            $"Set 1 of exercise '{exercise.Name}' is of type 'Distance' and should not have an RIR effort rating or target effort values specified.",
            ex.Errors["Exercises[0].Sets[0]"]);
    }

    [Fact]
    public async Task CreateWorkout_WithValidDistanceExercise_PersistsWorkoutWithExercisesAndSets()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Distance);
        const string userId = "user-1";

        var dto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs, distanceUnit: DistanceUnit.Meters,
            set: new SetDto(
                Id: null, Weight: 45, Reps: null, EffortRating: 8, ExerciseId: 0,
                Distance: 100, TargetDistanceMin: 50, TargetDistanceMax: 150));

        var result = await service.CreateWorkout(dto, userId);

        Assert.Single(result.Exercises);
        var set = Assert.Single(result.Exercises.First().Sets);
        Assert.Equal(45, set.Weight);
        Assert.Equal(100, set.Distance);
    }

    [Fact]
    public async Task CreateWorkout_WithMultipleValidationErrors_CollectsAllOfThemBeforeThrowing()
    {
        var (context, service) = CreateSut();
        var repsExercise = SeedExercise(context, name: "Bench Press", exerciseType: ExerciseType.Reps);
        var cardioExercise = SeedExercise(context, name: "Running", exerciseType: ExerciseType.Cardio);
        const string userId = "user-1";

        var dto = new WorkoutDto(
            Id: null,
            Title: "Push Day",
            UserId: userId,
            Date: new DateOnly(2026, 1, 1),
            Notes: null,
            Exercises:
            [
                new WorkoutExerciseDto(
                    Id: null,
                    Notes: null,
                    WeightUnit: WeightUnit.Lbs,
                    DistanceUnit: DistanceUnit.Kilometers,
                    EffortType: EffortRatingType.Rpe,
                    ExerciseId: repsExercise.Id,
                    WorkoutId: null,
                    Exercise: null,
                    Sets: [new SetDto(Id: null, Weight: 135, Reps: 5, EffortRating: 8, ExerciseId: 0)]),
                new WorkoutExerciseDto(
                    Id: null,
                    Notes: null,
                    WeightUnit: WeightUnit.Lbs,
                    DistanceUnit: null,
                    EffortType: EffortRatingType.Rpe,
                    ExerciseId: cardioExercise.Id,
                    WorkoutId: null,
                    Exercise: null,
                    Sets: [new SetDto(Id: null, Weight: null, Reps: null, EffortRating: 8, ExerciseId: 0, Distance: 5, DurationSeconds: 1200)])
            ]);

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.CreateWorkout(dto, userId));

        Assert.Equal(2, ex.Errors.Count);
        Assert.Contains("Exercises[0]", ex.Errors.Keys);
        Assert.Contains("Exercises[1]", ex.Errors.Keys);
    }

    [Fact]
    public async Task UpdateWorkout_WithInvalidExerciseTypeFieldCombination_ThrowsWorkoutValidationException()
    {
        var (context, service) = CreateSut();
        var exercise = SeedExercise(context, exerciseType: ExerciseType.Cardio);
        const string userId = "user-1";

        var workout = new Workout
        {
            Id = Guid.NewGuid().ToString(),
            Title = "Cardio Day",
            UserId = userId,
            Date = new DateOnly(2026, 1, 1),
            Exercises = new List<WorkoutExercise>
            {
                new WorkoutExercise
                {
                    ExerciseId = exercise.Id,
                    DistanceUnit = DistanceUnit.Kilometers,
                    Sets = new List<Set> { new Set { Distance = 5, DurationSeconds = 1200 } }
                }
            }
        };
        context.Workouts.Add(workout);
        await context.SaveChangesAsync();

        // Introduce an invalid weight unit on this Cardio exercise when updating.
        var updateDto = BuildWorkoutDto(
            userId, exercise.Id, weightUnit: WeightUnit.Lbs, distanceUnit: DistanceUnit.Kilometers,
            set: new SetDto(Id: null, Weight: null, Reps: null, EffortRating: 8, ExerciseId: 0, Distance: 5, DurationSeconds: 1200));
        updateDto = updateDto with { Id = workout.Id };

        var ex = await Assert.ThrowsAsync<WorkoutValidationException>(
            () => service.UpdateWorkout(workout.Id, updateDto, userId));

        Assert.Contains(
            $"Exercise '{exercise.Name}' is of type 'Cardio' and should not have a weight unit specified.",
            ex.Errors["Exercises[0]"]);

        // The workout must remain unmodified since validation happens before any mutation.
        var unchanged = await context.WorkoutExercises.Include(we => we.Sets)
            .FirstAsync(we => we.WorkoutId == workout.Id);
        Assert.Null(unchanged.WeightUnit);
    }

    #endregion
}
