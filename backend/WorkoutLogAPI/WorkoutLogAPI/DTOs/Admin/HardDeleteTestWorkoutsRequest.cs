using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Admin;

public record HardDeleteTestWorkoutsRequest(
    [param: Required(ErrorMessage = "Email is required."), 
            EmailAddress(ErrorMessage = "Invalid email format.")]
    string email);