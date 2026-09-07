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
                // never gets logged out mid-task. The frontend picks this up
                // from the response header and swaps its stored token.
                if (jwtService.ShouldRefreshToken(principal))
                {
                    var refreshedToken = jwtService.RefreshToken(principal);
                    context.HttpContext.Response.Headers["X-Refreshed-Token"] = refreshedToken;
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
              .AllowCredentials()
              .WithExposedHeaders("X-Refreshed-Token");
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Apply migrations and seed the database
// Seeding is indempotent, so it can be safely called on every startup
await app.SeedDatabaseAsync();

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();