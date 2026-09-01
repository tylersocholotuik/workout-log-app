using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace WorkoutLogAPI.Extensions;

public static class ControllerExtensions
{
    public static string GetUserId(this ControllerBase controller)
    {
        return controller.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new InvalidOperationException("User ID not found in claims.");
    }
}