using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using WorkoutLogAPI.DTOs.Admin;
using WorkoutLogAPI.DTOs.Workouts;

namespace WorkoutLogAPI.Tests.Integration;

/// <summary>
/// Enables the HardDeleteTestWorkouts endpoint for this test class only (it's disabled
/// by default, matching production), via <see cref="IntegrationTestBase"/>'s
/// additionalConfiguration hook. See <see cref="AdminControllerEndpointDisabledTests"/>
/// for coverage of the disabled case.
/// </summary>
[Collection(PostgresCollection.Name)]
public class AdminControllerTests(PostgresContainerFixture postgres) : IntegrationTestBase(
    postgres, new Dictionary<string, string?> { ["AdminEndpoints:HardDeleteTestWorkoutsEnabled"] = "true" })
{
    // Mirrors Program.cs's JSON options (camelCase string enums) so responses containing
    // WeightUnit deserialize correctly on the test client, which doesn't share the
    // server's configured JsonSerializerOptions.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private async Task<int> GetAnySeededExerciseIdAsync(string authCookie)
    {
        var response = await Client.GetWithCookieAsync("/api/exercises", authCookie);
        var exercises = await response.Content.ReadFromJsonAsync<List<DTOs.Exercises.ExerciseDto>>(JsonOptions);
        return exercises!.First().Id!.Value;
    }

    private async Task CreateWorkoutAsync(string authCookie, string title = "Test Workout")
    {
        var exerciseId = await GetAnySeededExerciseIdAsync(authCookie);
        var workoutDto = new WorkoutDto(
            null, title, null, DateOnly.FromDateTime(DateTime.UtcNow), null,
            [
                new WorkoutExerciseDto(null, null, Enums.WeightUnit.Lbs, exerciseId, null, null,
                    [new SetDto(null, 100, 5, 8, exerciseId)])
            ]);

        var response = await Client.PostAsJsonWithCsrfAsync("/api/workouts", workoutDto, authCookie);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task HardDeleteTestWorkouts_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await Client.DeleteAsJsonWithCsrfAsync(
            "/api/admin/workouts", new HardDeleteTestWorkoutsRequest("someone@example.com"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task HardDeleteTestWorkouts_AsNonAdmin_ReturnsForbidden()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();

        var response = await Client.DeleteAsJsonWithCsrfAsync(
            "/api/admin/workouts", new HardDeleteTestWorkoutsRequest("someone@example.com"), authCookie);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task HardDeleteTestWorkouts_WithoutCsrfHeader_ReturnsForbidden()
    {
        var adminCookie = await CreateAdminUserAndGetAuthCookieAsync();
        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/admin/workouts")
        {
            Content = JsonContent.Create(new HardDeleteTestWorkoutsRequest("someone@example.com"))
        };
        request.Headers.Add("Cookie", adminCookie);

        var response = await Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task HardDeleteTestWorkouts_WithInvalidEmailFormat_ReturnsBadRequest()
    {
        var adminCookie = await CreateAdminUserAndGetAuthCookieAsync();

        var response = await Client.DeleteAsJsonWithCsrfAsync(
            "/api/admin/workouts", new HardDeleteTestWorkoutsRequest("not-an-email"), adminCookie);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task HardDeleteTestWorkouts_WithUnknownEmail_ReturnsNotFound()
    {
        var adminCookie = await CreateAdminUserAndGetAuthCookieAsync();

        var response = await Client.DeleteAsJsonWithCsrfAsync(
            "/api/admin/workouts",
            new HardDeleteTestWorkoutsRequest($"{Guid.NewGuid():N}@example.com"),
            adminCookie);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task HardDeleteTestWorkouts_AsAdmin_RemovesOnlyTargetUsersWorkouts()
    {
        var adminCookie = await CreateAdminUserAndGetAuthCookieAsync();
        var targetEmail = $"{Guid.NewGuid():N}@example.com";
        var targetRegisterResponse = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/register",
            new DTOs.Auth.RegisterRequest(targetEmail, "Target", "User", null, "Password123!"));
        var targetCookie = targetRegisterResponse.ExtractCookie(Constants.AppConstants.Auth.TokenCookieName)!;
        await CreateWorkoutAsync(targetCookie, "Target User's Workout");

        var otherCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        await CreateWorkoutAsync(otherCookie, "Other User's Workout");

        var deleteResponse = await Client.DeleteAsJsonWithCsrfAsync(
            "/api/admin/workouts", new HardDeleteTestWorkoutsRequest(targetEmail), adminCookie);

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var targetWorkoutsResponse = await Client.GetWithCookieAsync("/api/workouts", targetCookie);
        var targetWorkouts = await targetWorkoutsResponse.Content.ReadFromJsonAsync<List<WorkoutDto>>(JsonOptions);
        Assert.Empty(targetWorkouts!);

        var otherWorkoutsResponse = await Client.GetWithCookieAsync("/api/workouts", otherCookie);
        var otherWorkouts = await otherWorkoutsResponse.Content.ReadFromJsonAsync<List<WorkoutDto>>(JsonOptions);
        Assert.Contains(otherWorkouts!, w => w.Title == "Other User's Workout");
    }
}

/// <summary>
/// Separate test class with its own <see cref="CustomWebApplicationFactory"/>
/// so this one runs with the endpoint left at its default, production-matching
/// "disabled" configuration, rather than the "enabled" override <see cref="AdminControllerTests"/>
/// applies for its whole class.
/// </summary>
[Collection(PostgresCollection.Name)]
public class AdminControllerEndpointDisabledTests(PostgresContainerFixture postgres) : IntegrationTestBase(postgres)
{
    [Fact]
    public async Task HardDeleteTestWorkouts_WhenEndpointDisabled_ReturnsNotFoundEvenForAdmin()
    {
        var adminCookie = await CreateAdminUserAndGetAuthCookieAsync();

        var response = await Client.DeleteAsJsonWithCsrfAsync(
            "/api/admin/workouts", new HardDeleteTestWorkoutsRequest("someone@example.com"), adminCookie);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
