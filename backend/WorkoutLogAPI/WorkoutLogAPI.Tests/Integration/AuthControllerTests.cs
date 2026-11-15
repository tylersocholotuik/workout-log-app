using System.Net;
using System.Net.Http.Json;
using Moq;
using WorkoutLogAPI.Constants;
using WorkoutLogAPI.DTOs.Auth;
using WorkoutLogAPI.DTOs.Email;

namespace WorkoutLogAPI.Tests.Integration;

[Collection(PostgresCollection.Name)]
public class AuthControllerTests(PostgresContainerFixture postgres) : IntegrationTestBase(postgres)
{
    private static RegisterRequest ValidRegisterRequest(string? email = null) => new(
        email ?? $"{Guid.NewGuid():N}@example.com",
        "Jane",
        "Doe",
        null,
        "Password123!");

    [Fact]
    public async Task Register_WithValidData_ReturnsOkSetsAuthCookieAndPersistsUser()
    {
        var request = ValidRegisterRequest();

        var response = await Client.PostAsJsonWithCsrfAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        Assert.NotNull(body);
        Assert.Equal(request.Email, body!.User.Email);
        Assert.Equal("Jane", body.User.FirstName);

        var authCookie = response.ExtractCookie(AppConstants.Auth.TokenCookieName);
        Assert.NotNull(authCookie);
    }

    [Fact]
    public async Task Register_WithoutCsrfHeader_ReturnsForbidden()
    {
        var response = await Client.PostAsJsonAsync("/api/auth/register", ValidRegisterRequest());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        var request = ValidRegisterRequest("duplicate@example.com");
        await Client.PostAsJsonWithCsrfAsync("/api/auth/register", request);

        var response = await Client.PostAsJsonWithCsrfAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ReturnsValidationError()
    {
        var request = new RegisterRequest("not-an-email", "Jane", "Doe", null, "Password123!");

        var response = await Client.PostAsJsonWithCsrfAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkAndSetsAuthCookie()
    {
        var registerRequest = ValidRegisterRequest();
        await Client.PostAsJsonWithCsrfAsync("/api/auth/register", registerRequest);

        var response = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/login", new LoginRequest(registerRequest.Email, registerRequest.Password));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(response.ExtractCookie(AppConstants.Auth.TokenCookieName));
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var registerRequest = ValidRegisterRequest();
        await Client.PostAsJsonWithCsrfAsync("/api/auth/register", registerRequest);

        var response = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/login", new LoginRequest(registerRequest.Email, "WrongPassword!"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithUnknownEmail_ReturnsUnauthorized()
    {
        var response = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/login", new LoginRequest("nobody@example.com", "Password123!"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_RevokesToken_SoSubsequentRequestIsUnauthorized()
    {
        var registerRequest = ValidRegisterRequest();
        var registerResponse = await Client.PostAsJsonWithCsrfAsync("/api/auth/register", registerRequest);
        var authCookie = registerResponse.ExtractCookie(AppConstants.Auth.TokenCookieName);

        var logoutResponse = await Client.PostAsJsonWithCsrfAsync<object?>(
            "/api/auth/logout", null, authCookie);
        Assert.Equal(HttpStatusCode.OK, logoutResponse.StatusCode);

        // /api/users/me is the current "who am I" endpoint (moved from /api/auth/me),
        // so it's the right place to confirm the revoked token is rejected.
        var meResponse = await Client.GetWithCookieAsync("/api/users/me", authCookie);

        Assert.Equal(HttpStatusCode.Unauthorized, meResponse.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_WithCorrectCurrentPassword_ReturnsOkAndSendsConfirmationEmail()
    {
        var registerRequest = ValidRegisterRequest();
        var registerResponse = await Client.PostAsJsonWithCsrfAsync("/api/auth/register", registerRequest);
        var authCookie = registerResponse.ExtractCookie(AppConstants.Auth.TokenCookieName);

        var response = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest(registerRequest.Password, "NewPassword456!"),
            authCookie);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // The new password must actually work for subsequent logins.
        var loginResponse = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/login", new LoginRequest(registerRequest.Email, "NewPassword456!"));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        EmailServiceMock.Verify(
            m => m.SendEmailAsync(
                It.IsAny<List<EmailAddress>>(),
                AppConstants.EmailSubjects.PasswordChangeConfirmation,
                It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task ChangePassword_WithWrongCurrentPassword_ReturnsBadRequestAndDoesNotChangePassword()
    {
        var registerRequest = ValidRegisterRequest();
        var registerResponse = await Client.PostAsJsonWithCsrfAsync("/api/auth/register", registerRequest);
        var authCookie = registerResponse.ExtractCookie(AppConstants.Auth.TokenCookieName);

        var response = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/change-password",
            new ChangePasswordRequest("WrongPassword!", "NewPassword456!"),
            authCookie);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var loginResponse = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/login", new LoginRequest(registerRequest.Email, registerRequest.Password));
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task ChangePassword_WithoutAuthCookie_ReturnsUnauthorized()
    {
        var response = await Client.PostAsJsonWithCsrfAsync(
            "/api/auth/change-password", new ChangePasswordRequest("OldPassword123!", "NewPassword456!"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

