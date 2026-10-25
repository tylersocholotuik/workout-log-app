using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using WorkoutLogAPI.DTOs.Exercises;
using WorkoutLogAPI.DTOs.Workouts;

namespace WorkoutLogAPI.Tests.Integration;
[Collection(PostgresCollection.Name)]
public class WorkoutControllerTests(PostgresContainerFixture postgres) : IntegrationTestBase(postgres)
{
    // Mirrors Program.cs's JSON options (camelCase string enums) so responses containing
    // WeightUnit deserialize correctly on the test client, which doesn't share the
    // server's configured JsonSerializerOptions.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    // Exercises come from the app's own startup seeding, so a valid ExerciseId always
    // exists to build workouts against, the same as it would in a real environment.
    private async Task<int> GetAnySeededExerciseIdAsync(string authCookie)
    {
        var response = await Client.GetWithCookieAsync("/api/exercises", authCookie);
        var exercises = await response.Content.ReadFromJsonAsync<List<ExerciseDto>>(JsonOptions);
        return exercises!.First().Id!.Value;
    }

    private async Task<WorkoutDto> CreateWorkoutAsync(
        string authCookie,
        string title = "Test Workout",
        Enums.EffortRatingType effortType = Enums.EffortRatingType.Rpe,
        double effortRating = 8)
    {
        var exerciseId = await GetAnySeededExerciseIdAsync(authCookie);
        var workoutDto = new WorkoutDto(
            null, title, null, DateOnly.FromDateTime(DateTime.UtcNow), "Some notes",
            [
                new WorkoutExerciseDto(null, "3x5", Enums.WeightUnit.Lbs, effortType, exerciseId, null, null,
                    [new SetDto(Id: null, Weight: 100, Reps: 5, EffortRating: effortRating, ExerciseId: exerciseId)])
            ]);

        var response = await Client.PostAsJsonWithCsrfAsync("/api/workouts", workoutDto, authCookie);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<WorkoutDto>(JsonOptions))!;
    }

    [Fact]
    public async Task GetUserWorkouts_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await Client.GetWithCookieAsync("/api/workouts");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateWorkout_WithValidData_ReturnsCreatedWorkoutWithExercisesAndSets()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();

        var workout = await CreateWorkoutAsync(authCookie);

        Assert.NotNull(workout.Id);
        Assert.Equal("Test Workout", workout.Title);
        Assert.Single(workout.Exercises!);
        Assert.Single(workout.Exercises![0].Sets!);
        Assert.Equal(100, workout.Exercises[0].Sets![0].Weight);
    }

    [Fact]
    public async Task CreateWorkout_WithoutCsrfHeader_ReturnsForbidden()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/workouts")
        {
            Content = JsonContent.Create(new WorkoutDto(
                null, "No CSRF", null, DateOnly.FromDateTime(DateTime.UtcNow), null, null))
        };
        request.Headers.Add("Cookie", authCookie);

        var response = await Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetUserWorkouts_OnlyReturnsTheAuthenticatedUsersWorkouts()
    {
        var userACookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var userBCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        await CreateWorkoutAsync(userACookie, "User A's Workout");

        var userBResponse = await Client.GetWithCookieAsync("/api/workouts", userBCookie);

        var userBWorkouts = await userBResponse.Content.ReadFromJsonAsync<List<WorkoutDto>>(JsonOptions);
        Assert.DoesNotContain(userBWorkouts!, w => w.Title == "User A's Workout");
    }

    [Fact]
    public async Task GetWorkoutById_ForAnotherUsersWorkout_DoesNotReturnIt()
    {
        var ownerCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var otherUserCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(ownerCookie);

        var response = await Client.GetWithCookieAsync($"/api/workouts/{workout.Id}", otherUserCookie);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateWorkout_WithValidData_PersistsChanges()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var updatedDto = workout with { Title = "Updated Title", Notes = "Updated notes" };
        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedDto, authCookie);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var getResponse = await Client.GetWithCookieAsync($"/api/workouts/{workout.Id}", authCookie);
        var fetched = await getResponse.Content.ReadFromJsonAsync<WorkoutDto>(JsonOptions);
        Assert.Equal("Updated Title", fetched!.Title);
        Assert.Equal("Updated notes", fetched.Notes);
    }

    [Fact]
    public async Task UpdateWorkout_AddingMultipleNewSetsInOneRequest_PersistsAllOfThem()
    {
        // The frontend submits unsaved sets with Id 0, not null. Sending two of them in the
        // same request reproduces a bug where the second matched the first's not-yet-saved
        // entity (both still Id 0 before SaveChanges) and overwrote it instead of being added
        // as its own set.
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);
        var exerciseId = workout.Exercises![0].ExerciseId;
        var existingSet = workout.Exercises![0].Sets![0];

        var newSet1 = new SetDto(Id: 0, Weight: 100, Reps: 5, EffortRating: 8, ExerciseId: exerciseId);
        var newSet2 = new SetDto(Id: 0, Weight: 105, Reps: 4, EffortRating: 9, ExerciseId: exerciseId);
        var updatedExercise = workout.Exercises![0] with { Sets = [existingSet, newSet1, newSet2] };
        var updatedWorkout = workout with { Exercises = [updatedExercise] };

        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedWorkout, authCookie);

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var getResponse = await Client.GetWithCookieAsync($"/api/workouts/{workout.Id}", authCookie);
        var fetched = await getResponse.Content.ReadFromJsonAsync<WorkoutDto>(JsonOptions);
        Assert.Equal(3, fetched!.Exercises![0].Sets!.Count);
        Assert.Contains(fetched.Exercises[0].Sets!, s => s.Weight == 100 && s.Reps == 5);
        Assert.Contains(fetched.Exercises[0].Sets!, s => s.Weight == 105 && s.Reps == 4);
    }

    [Theory]
    [InlineData(-50, 5, 8)]         // weight below min
    [InlineData(9999.5, 5, 8)]      // weight above max
    [InlineData(100.3, 5, 8)]       // weight not in steps of 0.5
    [InlineData(100, -1, 8)]        // reps below min
    [InlineData(100, 10000, 8)]     // reps above max
    [InlineData(100, 5, -0.5)]       // rpe below min
    [InlineData(100, 5, 10.5)]      // rpe above max
    [InlineData(100, 5, 7.3)]       // rpe not in steps of 0.5
    public async Task UpdateWorkout_WithInvalidSetData_ReturnsBadRequest(double weight, int reps, double rpe)
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var invalidSet = new SetDto(Id: null, Weight: weight, Reps: reps, EffortRating: rpe, ExerciseId: workout.Exercises![0].ExerciseId);
        var updatedExercise = workout.Exercises![0] with { Sets = [invalidSet] };
        var updatedWorkout = workout with { Exercises = [updatedExercise] };

        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedWorkout, authCookie);

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Theory]
    [InlineData(-1)]    // rir below min
    [InlineData(10.5)]  // rir above max
    [InlineData(2.5)]   // rir not a whole number
    public async Task UpdateWorkout_WithInvalidRirSetData_ReturnsBadRequest(double rir)
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie, effortType: Enums.EffortRatingType.Rir, effortRating: 2);

        var invalidSet = new SetDto(Id: null, Weight: 100, Reps: 5, EffortRating: rir, ExerciseId: workout.Exercises![0].ExerciseId);
        var updatedExercise = workout.Exercises![0] with { Sets = [invalidSet] };
        var updatedWorkout = workout with { Exercises = [updatedExercise] };

        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedWorkout, authCookie);

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Fact]
    public async Task CreateWorkout_WithRirEffortType_PersistsWholeNumberEffortRating()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();

        var workout = await CreateWorkoutAsync(authCookie, effortType: Enums.EffortRatingType.Rir, effortRating: 2);

        Assert.Equal(Enums.EffortRatingType.Rir, workout.Exercises![0].EffortType);
        Assert.Equal(2, workout.Exercises[0].Sets![0].EffortRating);
    }

    [Fact]
    public async Task CreateWorkout_WithTargetRepsAndTargetEffort_PersistsValues()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var exerciseId = await GetAnySeededExerciseIdAsync(authCookie);
        var workoutDto = new WorkoutDto(
            null, "Test Workout", null, DateOnly.FromDateTime(DateTime.UtcNow), null,
            [
                new WorkoutExerciseDto(null, null, Enums.WeightUnit.Lbs, Enums.EffortRatingType.Rpe, exerciseId, null, null,
                    [new SetDto(Id: null, Weight: 100, Reps: 5, EffortRating: 8, ExerciseId: exerciseId,
                        TargetRepsMin: 5, TargetRepsMax: 8, TargetEffortMin: 7, TargetEffortMax: 8.5)])
            ]);

        var response = await Client.PostAsJsonWithCsrfAsync("/api/workouts", workoutDto, authCookie);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var workout = (await response.Content.ReadFromJsonAsync<WorkoutDto>(JsonOptions))!;
        var set = workout.Exercises![0].Sets![0];
        Assert.Equal(5, set.TargetRepsMin);
        Assert.Equal(8, set.TargetRepsMax);
        Assert.Equal(7, set.TargetEffortMin);
        Assert.Equal(8.5, set.TargetEffortMax);
    }

    [Theory]
    [InlineData(-1, null)]    // target reps min below min
    [InlineData(10000, null)] // target reps min above max
    [InlineData(null, -1)]    // target reps max below min
    [InlineData(null, 10000)] // target reps max above max
    public async Task UpdateWorkout_WithInvalidTargetRepsData_ReturnsBadRequest(int? targetRepsMin, int? targetRepsMax)
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var invalidSet = new SetDto(Id: null, Weight: 100, Reps: 5, EffortRating: 8,
            ExerciseId: workout.Exercises![0].ExerciseId, TargetRepsMin: targetRepsMin, TargetRepsMax: targetRepsMax);
        var updatedExercise = workout.Exercises![0] with { Sets = [invalidSet] };
        var updatedWorkout = workout with { Exercises = [updatedExercise] };

        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedWorkout, authCookie);

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Theory]
    [InlineData(-0.5, null)]  // target effort min below min
    [InlineData(10.5, null)]  // target effort min above max
    [InlineData(7.3, null)]   // target effort min not in steps of 0.5
    [InlineData(null, -0.5)]  // target effort max below min
    [InlineData(null, 10.5)]  // target effort max above max
    [InlineData(null, 7.3)]   // target effort max not in steps of 0.5
    public async Task UpdateWorkout_WithInvalidTargetEffortData_ReturnsBadRequest(double? targetEffortMin, double? targetEffortMax)
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var invalidSet = new SetDto(Id: null, Weight: 100, Reps: 5, EffortRating: 8,
            ExerciseId: workout.Exercises![0].ExerciseId, TargetEffortMin: targetEffortMin, TargetEffortMax: targetEffortMax);
        var updatedExercise = workout.Exercises![0] with { Sets = [invalidSet] };
        var updatedWorkout = workout with { Exercises = [updatedExercise] };

        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedWorkout, authCookie);

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateWorkout_WithTargetEffortMinGreaterThanMax_ReturnsBadRequest()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var invalidSet = new SetDto(Id: null, Weight: 100, Reps: 5, EffortRating: 8,
            ExerciseId: workout.Exercises![0].ExerciseId, TargetEffortMin: 9, TargetEffortMax: 7);
        var updatedExercise = workout.Exercises![0] with { Sets = [invalidSet] };
        var updatedWorkout = workout with { Exercises = [updatedExercise] };

        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedWorkout, authCookie);

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateWorkout_WithTargetRepsMinGreaterThanMax_ReturnsBadRequest()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var invalidSet = new SetDto(Id: null, Weight: 100, Reps: 5, EffortRating: 8,
            ExerciseId: workout.Exercises![0].ExerciseId, TargetRepsMin: 10, TargetRepsMax: 5);
        var updatedExercise = workout.Exercises![0] with { Sets = [invalidSet] };
        var updatedWorkout = workout with { Exercises = [updatedExercise] };

        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedWorkout, authCookie);

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }

    [Fact]
    public async Task UpdateWorkout_WithRirEffortTypeAndNonWholeNumberTargetEffort_ReturnsBadRequest()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie, effortType: Enums.EffortRatingType.Rir, effortRating: 2);

        var invalidSet = new SetDto(Id: null, Weight: 100, Reps: 5, EffortRating: 2,
            ExerciseId: workout.Exercises![0].ExerciseId, TargetEffortMin: 2.5);
        var updatedExercise = workout.Exercises![0] with { Sets = [invalidSet] };
        var updatedWorkout = workout with { Exercises = [updatedExercise] };

        var updateResponse = await Client.PutAsJsonWithCsrfAsync($"/api/workouts/{workout.Id}", updatedWorkout, authCookie);

        Assert.Equal(HttpStatusCode.BadRequest, updateResponse.StatusCode);
    }


    [Fact]
    public async Task DeleteWorkout_RemovesItFromUsersWorkoutList()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var deleteResponse = await Client.DeleteWithCsrfAsync($"/api/workouts/{workout.Id}", authCookie);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var listResponse = await Client.GetWithCookieAsync("/api/workouts", authCookie);
        var workouts = await listResponse.Content.ReadFromJsonAsync<List<WorkoutDto>>(JsonOptions);
        Assert.DoesNotContain(workouts!, w => w.Id == workout.Id);
    }

    [Fact]
    public async Task GetExerciseHistory_ReturnsSetsFromPreviousWorkouts()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);
        var exerciseId = workout.Exercises![0].ExerciseId;

        var response = await Client.GetWithCookieAsync($"/api/workouts/exercise-history/{exerciseId}", authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var history = await response.Content.ReadFromJsonAsync<List<ExerciseHistoryDto>>(JsonOptions);
        Assert.NotEmpty(history!);
    }

    [Fact]
    public async Task GetActiveWorkout_WhenUserHasAnUnfinishedWorkout_ReturnsIt()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var response = await Client.GetWithCookieAsync("/api/workouts/active", authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var active = await response.Content.ReadFromJsonAsync<WorkoutDto>(JsonOptions);
        Assert.Equal(workout.Id, active!.Id);
    }

    [Fact]
    public async Task GetActiveWorkout_WhenUserHasNoUnfinishedWorkout_ReturnsNoContent()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);
        await Client.PatchWithCsrfAsync($"/api/workouts/{workout.Id}/finish", authCookie);

        var response = await Client.GetWithCookieAsync("/api/workouts/active", authCookie);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task GetActiveWorkout_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await Client.GetWithCookieAsync("/api/workouts/active");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateWorkout_WhenUserHasAnUnfinishedWorkout_ReturnsConflict()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        await CreateWorkoutAsync(authCookie, "First Workout");

        var secondWorkoutDto = new WorkoutDto(
            null, "Second Workout", null, DateOnly.FromDateTime(DateTime.UtcNow), null, null);

        var response = await Client.PostAsJsonWithCsrfAsync("/api/workouts", secondWorkoutDto, authCookie);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task CreateWorkout_AfterFinishingPriorWorkout_Succeeds()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var firstWorkout = await CreateWorkoutAsync(authCookie, "First Workout");
        await Client.PatchWithCsrfAsync($"/api/workouts/{firstWorkout.Id}/finish", authCookie);

        var secondWorkoutDto = new WorkoutDto(
            null, "Second Workout", null, DateOnly.FromDateTime(DateTime.UtcNow), null, null);

        var response = await Client.PostAsJsonWithCsrfAsync("/api/workouts", secondWorkoutDto, authCookie);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task FinishWorkout_WithValidId_ReturnsOkAndAllowsNewWorkoutCreation()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);

        var response = await Client.PatchWithCsrfAsync($"/api/workouts/{workout.Id}/finish", authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task FinishWorkout_WhenAlreadyFinished_ReturnsConflict()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);
        await Client.PatchWithCsrfAsync($"/api/workouts/{workout.Id}/finish", authCookie);

        var response = await Client.PatchWithCsrfAsync($"/api/workouts/{workout.Id}/finish", authCookie);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task FinishWorkout_ForAnotherUsersWorkout_ReturnsForbidden()
    {
        var ownerCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var otherUserCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(ownerCookie);

        var response = await Client.PatchWithCsrfAsync($"/api/workouts/{workout.Id}/finish", otherUserCookie);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task FinishWorkout_WithNonexistentId_ReturnsNotFound()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();

        var response = await Client.PatchWithCsrfAsync($"/api/workouts/{Guid.NewGuid()}/finish", authCookie);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task FinishWorkout_WithoutCsrfHeader_ReturnsForbidden()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var workout = await CreateWorkoutAsync(authCookie);
        var request = new HttpRequestMessage(HttpMethod.Patch, $"/api/workouts/{workout.Id}/finish");
        request.Headers.Add("Cookie", authCookie);

        var response = await Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task FinishWorkout_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await Client.PatchWithCsrfAsync($"/api/workouts/{Guid.NewGuid()}/finish");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
