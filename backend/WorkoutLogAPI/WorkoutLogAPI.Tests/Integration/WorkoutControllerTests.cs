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

    private async Task<WorkoutDto> CreateWorkoutAsync(string authCookie, string title = "Test Workout")
    {
        var exerciseId = await GetAnySeededExerciseIdAsync(authCookie);
        var workoutDto = new WorkoutDto(
            null, title, null, DateOnly.FromDateTime(DateTime.UtcNow), "Some notes",
            [
                new WorkoutExerciseDto(null, "3x5", Enums.WeightUnit.Lbs, exerciseId, null, null,
                    [new SetDto(null, 100, 5, 8, exerciseId)])
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
}
