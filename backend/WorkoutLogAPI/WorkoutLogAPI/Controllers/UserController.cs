using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkoutLogAPI.DTOs.Users;
using WorkoutLogAPI.Extensions;
using WorkoutLogAPI.Services;

namespace WorkoutLogAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/users/me")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly UserSettingsService _userSettingsService;
    private readonly ILogger<UserController> _logger;

    public UserController(
        UserService userService, 
        UserSettingsService userSettingsService,
        ILogger<UserController> logger)
    {
        _userService = userService;
        _userSettingsService = userSettingsService;
        _logger = logger;
    }
    
    [HttpGet]
    public async Task<ActionResult<UserDto>> Me()
    {
        try
        {
            var userId = this.GetUserId();
            var user = await _userService.GetUserByIdAsync(userId);
            return Ok(UserDto.FromUser(user));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user info: {Message}", ex.Message);
            return StatusCode(500, new { error = "An error occurred while retrieving user info" });
        }
    }
    
    [HttpGet("settings")]
    public async Task<ActionResult<UserSettingsDto>> GetMySettings()
    {
        try
        {
            var userId = this.GetUserId();
            var settings = await _userSettingsService.GetUserSettingsByUserIdAsync(userId);
            return Ok(UserSettingsDto.FromUserSettings(settings));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user settings: {Message}", ex.Message);
            return StatusCode(500, new { error = "An error occurred while retrieving user settings" });
        }
    }

    [HttpPatch]
    public async Task<ActionResult<UserDto>> UpdateMyInfo([FromBody] PatchUserDto patchDto)
    {
        try
        {
            var userId = this.GetUserId();
            var updatedUser = await _userService.UpdateUserAsync(userId, patchDto);
            return Ok(UserDto.FromUser(updatedUser));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Error updating user info: {Message}", ex.Message);
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user info: {Message}", ex.Message);
            return StatusCode(500, new { error = "An error occurred while updating user info" });
        }
    }
    
    [HttpPatch("settings")]
    public async Task<ActionResult<UserSettingsDto>> UpdateMySettings([FromBody] PatchUserSettingsDto patchDto)
    {
        try
        {
            var userId = this.GetUserId();
            var updatedSettings = await _userSettingsService.UpdateUserSettingsAsync(userId, patchDto);
            return Ok(UserSettingsDto.FromUserSettings(updatedSettings));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user settings: {Message}", ex.Message);
            return StatusCode(500, new { error = "An error occurred while updating user settings" });
        }
    }
}