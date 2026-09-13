using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.Extensions;
using WorkoutLogAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Scalar.AspNetCore;
using WorkoutLogAPI.Constants;

var builder = WebApplication.CreateBuilder(args);

// Add DbContext
builder.Services.AddDbContext<WorkoutDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add Services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<ExerciseService>();
builder.Services.AddScoped<WorkoutService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AuthService>();

// Add Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Preserve claim types exactly as issued (e.g. "sub", "email") instead
        // of remapping well-known JWT claims to long ClaimTypes URIs, so claim
        // lookups stay consistent wherever the principal is used.
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwtSettings["Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            // Override the default behavior to look for the token in the cookie if no Authorization header is present
            // Frontend does not send an Authorization header because the cookie is HttpOnly and set by the server
            OnMessageReceived = context =>
            {
                if (!string.IsNullOrEmpty(context.Request.Headers.Authorization))
                {
                    // Authorization header is present, let JwtBearer handle it
                    // required for manual testing to work
                    return Task.CompletedTask;
                }
                
                // If no Authorization header, look for the token in the cookie instead
                context.Token = context.Request.Cookies[AppConstants.Auth.TokenCookieName];
                return Task.CompletedTask;
            },

            OnTokenValidated = async context =>
            {
                var principal = context.Principal!;
                var jti = principal.FindFirstValue(JwtRegisteredClaimNames.Jti);
                var jwtService = context.HttpContext.RequestServices.GetRequiredService<JwtService>();

                // Reject tokens that have been explicitly revoked (e.g. via
                // logout) even if their signature and lifetime are otherwise
                // still valid.
                if (await jwtService.IsTokenRevokedAsync(jti))
                {
                    context.Fail("Token has been revoked");
                    return;
                }
                
                // Reject tokens if the user's password has been changed since the token was issued.
                if (await jwtService.HasPasswordChangedSinceTokenIssuedAsync(principal))
                {
                    context.Fail("Password has been changed since token was issued");
                    return;
                }
                
                // Sliding expiration: if this valid token is close to
                // expiring, create a replacement so an active user
                // never gets logged out mid-task.
                if (jwtService.ShouldRefreshToken(principal))
                {
                    var refreshedToken = jwtService.RefreshToken(principal);
                    context.HttpContext.Response.Cookies.Append(
                        AppConstants.Auth.TokenCookieName, refreshedToken, jwtService.BuildAuthCookieOptions());
                }
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
builder.Services.AddOpenApi();

// Add CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? throw new InvalidOperationException("Cors:AllowedOrigins configuration is missing");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Apply migrations and seed the database
// Seeding is idempotent, so it can be safely called on every startup
await app.SeedDatabaseAsync();

// Note: no app.UseHttpsRedirection() here. Render (and most PaaS hosts) terminate TLS
// at their edge/load balancer and forward requests to the container over plain HTTP,
// so Kestrel always sees Request.Scheme as "http". Enabling HTTPS redirection in that
// setup causes an infinite redirect loop: the app redirects to https, the client
// re-requests over https, Render forwards it internally as http again, and the app
// redirects again. Render already enforces HTTPS for public traffic at the edge, so
// this middleware isn't needed.

app.UseCors("AllowFrontend");

// CSRF protection middleware: reject state-changing requests without the CSRF header
app.Use(async (context, next) =>
{
    var method = context.Request.Method;
    var isStateChanging = !HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && !HttpMethods.IsOptions(method);
    if (isStateChanging && !context.Request.Headers.ContainsKey(AppConstants.Auth.CsrfHeaderName))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return;
    }
    await next();
});

app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint for Render to verify the instance is ready
// to receive traffic. Confirms DB connectivity, since a running process that can't
// reach the database isn't actually healthy. Mapped before auth so it's publicly
// reachable without a token, and outside MapControllers so it isn't versioned as
// part of the public API surface.
app.MapGet("/health-check", async (WorkoutDbContext context) =>
{
    try
    {
        return await context.Database.CanConnectAsync()
            ? Results.Ok(new { status = "healthy" })
            : Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }
    catch
    {
        return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
    }
});

app.MapControllers();

app.Run();