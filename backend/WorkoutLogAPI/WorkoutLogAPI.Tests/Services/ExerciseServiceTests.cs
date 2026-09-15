using WorkoutLogAPI.Data;
using WorkoutLogAPI.Models;
using WorkoutLogAPI.Services;
using WorkoutLogAPI.Tests.TestHelpers;

namespace WorkoutLogAPI.Tests.Services;

public class ExerciseServiceTests
{
    private static (WorkoutDbContext context, ExerciseService service) CreateSut()
    {
        var context = InMemoryDbContextFactory.Create();
        var service = new ExerciseService(context);
        return (context, service);
    }

    [Fact]
    public async Task CreateUserExercise_WithNewName_CreatesExercise()
    {
        var (_, service) = CreateSut();

        var result = await service.CreateUserExercise("user-1", "Deadlift");

        Assert.Equal("Deadlift", result.Name);
        Assert.Equal("user-1", result.UserId);
    }

    [Fact]
    public async Task CreateUserExercise_TrimsWhitespaceFromName()
    {
        var (_, service) = CreateSut();

        var result = await service.CreateUserExercise("user-1", "  Deadlift  ");

        Assert.Equal("Deadlift", result.Name);
    }

    [Fact]
    public async Task CreateUserExercise_WithBlankName_ThrowsArgumentException()
    {
        var (_, service) = CreateSut();

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateUserExercise("user-1", "   "));
    }

    [Theory]
    [InlineData("Deadlift", "deadlift")] // different casing
    [InlineData("Deadlift", "Deadlift")] // exact match
    public async Task CreateUserExercise_WhenNameAlreadyExistsForUser_ThrowsInvalidOperationException(
        string existingName, string newName)
    {
        var (context, service) = CreateSut();
        context.Exercises.Add(new Exercise { Name = existingName, UserId = "user-1" });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateUserExercise("user-1", newName));
    }

    [Fact]
    public async Task CreateUserExercise_WhenSystemExerciseWithSameNameExists_ThrowsInvalidOperationException()
    {
        // System exercises (UserId == null) are shared across all users, so a
        // user shouldn't be able to create a duplicate of one under their own name either.
        var (context, service) = CreateSut();
        context.Exercises.Add(new Exercise { Name = "Squat", UserId = null });
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateUserExercise("user-1", "Squat"));
    }

    [Fact]
    public async Task GetExercises_ReturnsOnlyOwnAndSystemExercises_ExcludingDeletedAndOtherUsers()
    {
        var (context, service) = CreateSut();
        context.Exercises.AddRange(
            new Exercise { Name = "System Exercise", UserId = null },
            new Exercise { Name = "My Exercise", UserId = "user-1" },
            new Exercise { Name = "Someone Else's Exercise", UserId = "user-2" },
            new Exercise { Name = "My Deleted Exercise", UserId = "user-1", Deleted = true });
        await context.SaveChangesAsync();

        var result = await service.GetExercises("user-1");

        Assert.Equal(2, result.Count);
        Assert.Contains(result, e => e.Name == "System Exercise");
        Assert.Contains(result, e => e.Name == "My Exercise");
    }
}
