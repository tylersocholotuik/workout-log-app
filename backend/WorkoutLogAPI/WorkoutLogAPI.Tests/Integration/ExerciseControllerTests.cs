using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using WorkoutLogAPI.DTOs.Exercises;
using WorkoutLogAPI.Enums;

namespace WorkoutLogAPI.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class ExerciseControllerTests(PostgresContainerFixture postgres) : IntegrationTestBase(postgres)
{
    // Mirrors Program.cs's JSON options (camelCase string enums) so responses containing
    // ExerciseType deserialize correctly on the test client, which doesn't share the
    // server's configured JsonSerializerOptions.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    [Fact]
    public async Task GetExercises_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await Client.GetWithCookieAsync("/api/exercises");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetExercises_WhenAuthenticated_ReturnsSeededGlobalExercises()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();

        var response = await Client.GetWithCookieAsync("/api/exercises", authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var exercises = await response.Content.ReadFromJsonAsync<List<ExerciseDto>>(JsonOptions);
        // App.SeedDatabaseAsync populates the global exercise list on startup, so a
        // brand-new user should still see all of them (in addition to any of their own).
        Assert.NotNull(exercises);
        Assert.NotEmpty(exercises!);
    }

    [Fact]
    public async Task CreateUserExercise_WithValidName_ReturnsCreatedAndIsThenRetrievable()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var newExercise = new ExerciseDto(null, "My Custom Exercise", ExerciseType.Reps, null);

        var createResponse = await Client.PostAsJsonWithCsrfAsync("/api/exercises", newExercise, authCookie);

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ExerciseDto>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal("My Custom Exercise", created!.Name);
        Assert.NotNull(created.Id);

        var getResponse = await Client.GetWithCookieAsync($"/api/exercises/{created.Id}", authCookie);
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        var fetched = await getResponse.Content.ReadFromJsonAsync<ExerciseDto>(JsonOptions);
        Assert.Equal("My Custom Exercise", fetched!.Name);
    }

    [Fact]
    public async Task CreateUserExercise_WithoutCsrfHeader_ReturnsForbidden()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/exercises")
        {
            Content = JsonContent.Create(new ExerciseDto(null, "No CSRF Header", ExerciseType.Reps, null))
        };
        request.Headers.Add("Cookie", authCookie);

        var response = await Client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task GetExerciseById_WithUnknownId_ReturnsNotFound()
    {
        var authCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();

        var response = await Client.GetWithCookieAsync("/api/exercises/999999999", authCookie);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateUserExercise_IsNotVisibleToOtherUsers()
    {
        var ownerCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();
        var otherUserCookie = await Client.RegisterNewUserAndGetAuthCookieAsync();

        var createResponse = await Client.PostAsJsonWithCsrfAsync(
            "/api/exercises", new ExerciseDto(null, "Owner-Only Exercise", ExerciseType.Reps, null), ownerCookie);
        var created = await createResponse.Content.ReadFromJsonAsync<ExerciseDto>(JsonOptions);

        var response = await Client.GetWithCookieAsync($"/api/exercises/{created!.Id}", otherUserCookie);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
