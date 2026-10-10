using System.Net.Http.Json;
using WorkoutLogAPI.Constants;
using WorkoutLogAPI.DTOs.Auth;

namespace WorkoutLogAPI.Tests.Integration;

/// <summary>
/// Small helpers shared by integration tests that exercise cookie-authenticated,
/// CSRF-protected endpoints through a real <see cref="HttpClient"/> talking to the
/// in-process test server.
/// </summary>
public static class HttpTestExtensions
{
    /// <summary>
    /// Satisfies the app's CSRF middleware, which rejects any state-changing
    /// request (anything but GET/HEAD/OPTIONS) that doesn't carry this header.
    /// </summary>
    public static void AddCsrfHeader(this HttpRequestMessage request) =>
        request.Headers.Add("X-Requested-With", "XMLHttpRequest");

    /// <summary>
    /// Pulls the auth cookie's "name=value" pair out of a response's Set-Cookie
    /// header so it can be attached to later requests. The test client doesn't use
    /// a CookieContainer, so cookies must be threaded through tests manually.
    /// </summary>
    public static string? ExtractCookie(this HttpResponseMessage response, string cookieName)
    {
        if (!response.Headers.TryGetValues("Set-Cookie", out var setCookieHeaders))
        {
            return null;
        }

        foreach (var header in setCookieHeaders)
        {
            var namePrefix = $"{cookieName}=";
            if (header.StartsWith(namePrefix))
            {
                return header.Split(';')[0];
            }
        }

        return null;
    }

    /// <summary>
    /// Core request builder shared by all the method-specific helpers below. Attaches
    /// the auth cookie and JSON body (if present), and adds the CSRF header for any
    /// state-changing method, since the app's CSRF middleware only requires it on
    /// anything other than GET/HEAD/OPTIONS.
    /// </summary>
    private static async Task<HttpResponseMessage> SendAsync<T>(
        this HttpClient client, HttpMethod method, string requestUri, T? body, string? authCookie)
    {
        var request = new HttpRequestMessage(method, requestUri);

        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        if (method != HttpMethod.Get && method != HttpMethod.Head && method != HttpMethod.Options)
        {
            request.AddCsrfHeader();
        }

        if (authCookie is not null)
        {
            request.Headers.Add("Cookie", authCookie);
        }

        return await client.SendAsync(request);
    }

    public static Task<HttpResponseMessage> GetWithCookieAsync(
        this HttpClient client, string requestUri, string? authCookie = null) =>
        client.SendAsync<object>(HttpMethod.Get, requestUri, null, authCookie);

    public static Task<HttpResponseMessage> PostAsJsonWithCsrfAsync<T>(
        this HttpClient client, string requestUri, T body, string? authCookie = null) =>
        client.SendAsync(HttpMethod.Post, requestUri, body, authCookie);

    public static Task<HttpResponseMessage> PutAsJsonWithCsrfAsync<T>(
        this HttpClient client, string requestUri, T body, string? authCookie = null) =>
        client.SendAsync(HttpMethod.Put, requestUri, body, authCookie);

    public static Task<HttpResponseMessage> PatchWithCsrfAsync(
        this HttpClient client, string requestUri, string? authCookie = null) =>
        client.SendAsync<object>(HttpMethod.Patch, requestUri, null, authCookie);

    public static Task<HttpResponseMessage> PatchAsJsonWithCsrfAsync<T>(
        this HttpClient client, string requestUri, T body, string? authCookie = null) =>
        client.SendAsync(HttpMethod.Patch, requestUri, body, authCookie);

    public static Task<HttpResponseMessage> DeleteWithCsrfAsync(
        this HttpClient client, string requestUri, string? authCookie = null) =>
        client.SendAsync<object>(HttpMethod.Delete, requestUri, null, authCookie);

    public static Task<HttpResponseMessage> DeleteAsJsonWithCsrfAsync<T>(
        this HttpClient client, string requestUri, T body, string? authCookie = null) =>
        client.SendAsync(HttpMethod.Delete, requestUri, body, authCookie);

    /// <summary>
    /// Registers a brand-new user (unique email each call) through the real
    /// /api/auth/register endpoint and returns the "name=value" auth cookie so
    /// tests for other controllers can authenticate as a fresh user without
    /// duplicating the registration boilerplate.
    /// </summary>
    public static async Task<string> RegisterNewUserAndGetAuthCookieAsync(this HttpClient client)
    {
        var request = new RegisterRequest(
            $"{Guid.NewGuid():N}@example.com", "Jane", "Doe", null, "Password123!");

        var response = await client.PostAsJsonWithCsrfAsync("/api/auth/register", request);
        var authCookie = response.ExtractCookie(AppConstants.Auth.TokenCookieName);

        return authCookie ?? throw new InvalidOperationException(
            "Registration did not return an auth cookie; check the response for a validation error.");
    }
}
