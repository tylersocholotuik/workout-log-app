using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;

namespace WorkoutLogAPI.Extensions;

public static class ControllerExtensions
{
    public static string GetUserId(this ControllerBase controller)
    {
        return controller.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? throw new InvalidOperationException("User ID not found in claims.");
    }
}