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

    public static async Task<HttpResponseMessage> PostAsJsonWithCsrfAsync<T>(
        this HttpClient client, string requestUri, T body, string? authCookie = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, requestUri)
        {
            Content = JsonContent.Create(body)
        };
        request.AddCsrfHeader();
        if (authCookie is not null)
        {
            request.Headers.Add("Cookie", authCookie);
        }

        return await client.SendAsync(request);
    }

    public static async Task<HttpResponseMessage> GetWithCookieAsync(
        this HttpClient client, string requestUri, string? authCookie = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, requestUri);
        if (authCookie is not null)
        {
            request.Headers.Add("Cookie", authCookie);
        }

        return await client.SendAsync(request);
    }

    public static async Task<HttpResponseMessage> PutAsJsonWithCsrfAsync<T>(
        this HttpClient client, string requestUri, T body, string? authCookie = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, requestUri)
        {
            Content = JsonContent.Create(body)
        };
        request.AddCsrfHeader();
        if (authCookie is not null)
        {
            request.Headers.Add("Cookie", authCookie);
        }

        return await client.SendAsync(request);
    }

    public static async Task<HttpResponseMessage> DeleteWithCsrfAsync(
        this HttpClient client, string requestUri, string? authCookie = null)
    {
        var request = new HttpRequestMessage(HttpMethod.Delete, requestUri);
        request.AddCsrfHeader();
        if (authCookie is not null)
        {
            request.Headers.Add("Cookie", authCookie);
        }

        return await client.SendAsync(request);
    }

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
