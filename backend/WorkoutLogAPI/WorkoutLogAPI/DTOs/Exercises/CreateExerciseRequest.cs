using System.ComponentModel.DataAnnotations;

namespace WorkoutLogAPI.DTOs.Exercises;

public class CreateExerciseRequest
{
    public string Name { get; set; } = "";
}