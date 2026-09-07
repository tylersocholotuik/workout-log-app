using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WorkoutLogAPI.Data;
using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.Services;

public class JwtService
{
    private readonly IConfiguration _configuration;
    private readonly WorkoutDbContext _context;

    public JwtService(IConfiguration configuration, WorkoutDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    public string GenerateToken(User user)
    {
        var claims = BuildClaims(
            id: user.Id,
            email: user.Email,
            firstName: user.FirstName,
            lastName: user.LastName,
            displayName: user.DisplayName ?? "",
            isAdmin: user.IsAdmin.ToString());

        return CreateToken(claims);
    }

    // Overload used for refreshing: pulls the same claim values back off an
    // already-validated principal instead of hitting the DB, then builds a
    // token the same way GenerateToken(User) does.
    public string GenerateToken(ClaimsPrincipal principal)
    {
        var claims = BuildClaims(
            id: principal.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? "",
            email: principal.FindFirstValue(JwtRegisteredClaimNames.Email) ?? "",
            firstName: principal.FindFirstValue(JwtRegisteredClaimNames.GivenName) ?? "",
            lastName: principal.FindFirstValue(JwtRegisteredClaimNames.FamilyName) ?? "",
            displayName: principal.FindFirstValue(JwtRegisteredClaimNames.PreferredUsername) ?? "",
            isAdmin: principal.FindFirstValue("is_admin") ?? bool.FalseString);

        return CreateToken(claims);
    }

    private static Claim[] BuildClaims(string id, string email, string firstName, string lastName, string displayName, string isAdmin)
    {
        return new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, id),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.GivenName, firstName),
            new Claim(JwtRegisteredClaimNames.FamilyName, lastName),
            new Claim(JwtRegisteredClaimNames.PreferredUsername, displayName),
            new Claim("is_admin", isAdmin),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
    }

    // Mints a brand-new token (fresh jti + expiry) carrying over the same
    // user claims from an existing, still-valid token. Used to silently
    // extend an active user's session (sliding expiration) without a
    // dedicated refresh endpoint or DB lookup.
    public string RefreshToken(ClaimsPrincipal principal) => GenerateToken(principal);

    // True once the token has less than Jwt:RefreshThresholdInMinutes left
    // before it expires, signalling that a fresh token should be issued to
    // keep an active user's session alive without interruption.
    public bool ShouldRefreshToken(ClaimsPrincipal principal)
    {
        var expClaim = principal.FindFirstValue(JwtRegisteredClaimNames.Exp);
        if (string.IsNullOrEmpty(expClaim) || !long.TryParse(expClaim, out var expUnixSeconds))
        {
            return false;
        }

        var expiresAt = DateTimeOffset.FromUnixTimeSeconds(expUnixSeconds).UtcDateTime;
        var remaining = expiresAt - DateTime.UtcNow;
        
        // Default refresh threshold to 30 minutes if the configuration value is missing or invalid
        if (!double.TryParse(_configuration["Jwt:RefreshThresholdInMinutes"], out var thresholdMinutes))
        {
            thresholdMinutes = 30;
        }

        return remaining > TimeSpan.Zero && remaining <= TimeSpan.FromMinutes(thresholdMinutes);
    }

    private string CreateToken(IEnumerable<Claim> claims)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
        
        // Default token expiration to 180 minutes if the configuration value is missing or invalid
        // During a workout, there will be no requests if the user does not save.
        if (!double.TryParse(_configuration["Jwt:TokenExpirationInMinutes"], out var tokenExpirationInMinutes))
        {
            tokenExpirationInMinutes = 180;
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(tokenExpirationInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:SecretKey"]!);

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }

    // Invalidates the given token immediately by recording its unique id (jti)
    // and expiry as revoked, so it will be rejected on future requests even
    // though it hasn't naturally expired yet.
    public async Task<bool> RevokeTokenAsync(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();

        if (!tokenHandler.CanReadToken(token))
        {
            return false;
        }

        var jwtToken = tokenHandler.ReadJwtToken(token);
        var jti = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;

        if (string.IsNullOrEmpty(jti))
        {
            return false;
        }

        // Purge naturally expired revoked tokens to keep the table size manageable
        // Ideally, this should be a scheduled job, but Render doesn't support cron jobs.
        await _context.RevokedTokens
            .Where(rt => rt.ExpiresAt < DateTime.UtcNow)
            .ExecuteDeleteAsync();

        var alreadyRevoked = await _context.RevokedTokens.AnyAsync(rt => rt.Jti == jti);
        if (alreadyRevoked)
        {
            return true;
        }

        _context.RevokedTokens.Add(new RevokedToken
        {
            Jti = jti,
            ExpiresAt = jwtToken.ValidTo,
            RevokedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IsTokenRevokedAsync(string? jti)
    {
        if (string.IsNullOrEmpty(jti))
        {
            return false;
        }

        return await _context.RevokedTokens.AnyAsync(rt => rt.Jti == jti);
    }
}
