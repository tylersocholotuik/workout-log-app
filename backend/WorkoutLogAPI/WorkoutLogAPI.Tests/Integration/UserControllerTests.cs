using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Moq;
using WorkoutLogAPI.Constants;
using WorkoutLogAPI.DTOs.Auth;
using WorkoutLogAPI.DTOs.Email;
using WorkoutLogAPI.DTOs.Users;
using WorkoutLogAPI.Enums;

namespace WorkoutLogAPI.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class UserControllerTests(PostgresContainerFixture postgres) : IntegrationTestBase(postgres)
{
    // Enum values are serialized as camelCase strings (e.g. "dark"), matching the
    // server's configured JsonSerializerOptions.
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };

    private static RegisterRequest ValidRegisterRequest(string? email = null) => new(
        email ?? $"{Guid.NewGuid():N}@example.com",
        "Jane",
        "Doe",
        null,
        "Password123!");

    private async Task<(RegisterRequest request, string authCookie)> RegisterUserAsync()
    {
        var request = ValidRegisterRequest();
        var response = await Client.PostAsJsonWithCsrfAsync("/api/auth/register", request);
        var authCookie = response.ExtractCookie(AppConstants.Auth.TokenCookieName)
            ?? throw new InvalidOperationException("Registration did not return an auth cookie.");
        return (request, authCookie);
    }

    [Fact]
    public async Task Me_WithValidAuthCookie_ReturnsCurrentUser()
    {
        var (registerRequest, authCookie) = await RegisterUserAsync();

        var response = await Client.GetWithCookieAsync("/api/users/me", authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.Equal(registerRequest.Email, user!.Email);
    }

    [Fact]
    public async Task Me_WithoutAuthCookie_ReturnsUnauthorized()
    {
        var response = await Client.GetWithCookieAsync("/api/users/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateMyInfo_WithNewFirstName_ReturnsOkAndPersistsChange()
    {
        var (_, authCookie) = await RegisterUserAsync();

        var response = await Client.PatchAsJsonWithCsrfAsync(
            "/api/users/me", new PatchUserDto(null, "Updated", null, null), authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.Equal("Updated", user!.FirstName);
    }

    [Fact]
    public async Task UpdateMyInfo_WithNewEmail_ReturnsOkAndNotifiesOriginalAddress()
    {
        var (registerRequest, authCookie) = await RegisterUserAsync();
        var newEmail = $"{Guid.NewGuid():N}@example.com";

        var response = await Client.PatchAsJsonWithCsrfAsync(
            "/api/users/me", new PatchUserDto(newEmail, null, null, null), authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var user = await response.Content.ReadFromJsonAsync<UserDto>();
        Assert.Equal(newEmail, user!.Email);

        // Must notify the ORIGINAL address, not the new (unverified) one.
        EmailServiceMock.Verify(
            m => m.SendEmailAsync(
                It.Is<List<EmailAddress>>(r => r.Single().Email == registerRequest.Email),
                AppConstants.EmailSubjects.EmailChangeConfirmation,
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateMyInfo_WithUnchangedEmail_DoesNotSendConfirmationEmail()
    {
        var (registerRequest, authCookie) = await RegisterUserAsync();

        var response = await Client.PatchAsJsonWithCsrfAsync(
            "/api/users/me", new PatchUserDto(registerRequest.Email, "Updated", null, null), authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        EmailServiceMock.Verify(
            m => m.SendEmailAsync(It.IsAny<List<EmailAddress>>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateMyInfo_WithEmailAlreadyTakenByAnotherUser_ReturnsConflict()
    {
        var (otherRequest, _) = await RegisterUserAsync();
        var (_, authCookie) = await RegisterUserAsync();

        var response = await Client.PatchAsJsonWithCsrfAsync(
            "/api/users/me", new PatchUserDto(otherRequest.Email, null, null, null), authCookie);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task UpdateMyInfo_WithoutAuthCookie_ReturnsUnauthorized()
    {
        var response = await Client.PatchAsJsonWithCsrfAsync(
            "/api/users/me", new PatchUserDto(null, "Updated", null, null));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetMySettings_WithValidAuthCookie_ReturnsDefaultSettings()
    {
        // Registration must create a default settings row for every new user.
        var (_, authCookie) = await RegisterUserAsync();

        var response = await Client.GetWithCookieAsync("/api/users/me/settings", authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var settings = await response.Content.ReadFromJsonAsync<UserSettingsDto>(JsonOptions);
        Assert.Equal(Theme.Dark, settings!.Theme);
        Assert.Equal(WeightUnit.Lbs, settings.WeightUnit);
        Assert.Equal(DistanceUnit.Meters, settings.DistanceUnit);
        Assert.Equal(EffortRatingType.Rpe, settings.EffortType);
        Assert.True(settings.ShowOneRepMax);
    }

    [Fact]
    public async Task GetMySettings_WithoutAuthCookie_ReturnsUnauthorized()
    {
        var response = await Client.GetWithCookieAsync("/api/users/me/settings");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task UpdateMySettings_WithPartialPatch_UpdatesOnlyProvidedFieldsAndReturnsOk()
    {
        var (_, authCookie) = await RegisterUserAsync();

        var response = await Client.PatchAsJsonWithCsrfAsync(
            "/api/users/me/settings",
            new PatchUserSettingsDto(Theme.Light, WeightUnit.Kg, null, null, null),
            authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var settings = await response.Content.ReadFromJsonAsync<UserSettingsDto>(JsonOptions);
        Assert.Equal(Theme.Light, settings!.Theme);
        Assert.Equal(WeightUnit.Kg, settings.WeightUnit);
        // Untouched fields must retain their defaults.
        Assert.Equal(DistanceUnit.Meters, settings.DistanceUnit);
        Assert.Equal(EffortRatingType.Rpe, settings.EffortType);
        Assert.True(settings.ShowOneRepMax);

        // The change must be persisted, not just reflected in the response.
        var getResponse = await Client.GetWithCookieAsync("/api/users/me/settings", authCookie);
        var persisted = await getResponse.Content.ReadFromJsonAsync<UserSettingsDto>(JsonOptions);
        Assert.Equal(Theme.Light, persisted!.Theme);
        Assert.Equal(WeightUnit.Kg, persisted.WeightUnit);
    }

    [Fact]
    public async Task UpdateMySettings_WithoutAuthCookie_ReturnsUnauthorized()
    {
        var response = await Client.PatchAsJsonWithCsrfAsync(
            "/api/users/me/settings", new PatchUserSettingsDto(Theme.Light, null, null, null, null));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
