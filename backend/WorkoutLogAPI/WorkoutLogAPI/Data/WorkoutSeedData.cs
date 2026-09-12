using WorkoutLogAPI.Enums;
using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.Data;

public class WorkoutSeedData
{
    public static List<Workout> GetSeedWorkouts(string userId)
    {
        return
        [
            new Workout
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Full Body Workout A",
                Notes = "A basic full body workout.",
                CreatedAt = DateTime.UtcNow,
                UserId = userId,
                Exercises =
                [
                    new WorkoutExercise
                    {
                        ExerciseId = 172, // Squat (High Bar)
                        Notes = "3 sets of 5-8 reps",
                        WeightUnit = WeightUnit.Lbs,
                        Sets =
                        [
                            new Set { Reps = 8, Weight = 315, Rpe = 8 },
                            new Set { Reps = 7, Weight = 315, Rpe = 8.5 },
                            new Set { Reps = 6, Weight = 315, Rpe = 9 },
                        ]
                    },
                    new WorkoutExercise
                    {
                        ExerciseId = 5, // Bench Press
                        Notes = "3 sets of 5-8 reps",
                        WeightUnit = WeightUnit.Lbs,
                        Sets =
                        [
                            new Set { Reps = 8, Weight = 245, Rpe = 8 },
                            new Set { Reps = 7, Weight = 245, Rpe = 8.5 },
                            new Set { Reps = 6, Weight = 245, Rpe = 9 },
                        ]
                    },
                    new WorkoutExercise
                    {
                        ExerciseId = 138, // Romanian Deadlift (Barbell)
                        Notes = "3 sets of 5-8 reps",
                        WeightUnit = WeightUnit.Lbs,
                        Sets =
                        [
                            new Set { Reps = 8, Weight = 405, Rpe = 8 },
                            new Set { Reps = 7, Weight = 405, Rpe = 8.5 },
                            new Set { Reps = 6, Weight = 405, Rpe = 9 },
                        ]
                    }
                ]
            },
            new Workout
            {
                Id = Guid.NewGuid().ToString(),
                Title = "Full Body Workout B",
                Notes = "A basic full body workout.",
                CreatedAt = DateTime.UtcNow,
                UserId = userId,
                Exercises =
                [
                    new WorkoutExercise
                    {
                        ExerciseId = 46, // Deadlift
                        Notes = "3 sets of 5-8 reps",
                        WeightUnit = WeightUnit.Lbs,
                        Sets =
                        [
                            new Set { Reps = 8, Weight = 495, Rpe = 8 },
                            new Set { Reps = 7, Weight = 495, Rpe = 8.5 },
                            new Set { Reps = 6, Weight = 495, Rpe = 9 },
                        ]
                    },
                    new WorkoutExercise
                    {
                        ExerciseId = 108, // Overhead Press (Barbell, Standing)
                        Notes = "3 sets of 5-8 reps",
                        WeightUnit = WeightUnit.Lbs,
                        Sets =
                        [
                            new Set { Reps = 8, Weight = 135, Rpe = 8 },
                            new Set { Reps = 7, Weight = 135, Rpe = 8.5 },
                            new Set { Reps = 6, Weight = 135, Rpe = 9 },
                        ]
                    },
                    new WorkoutExercise
                    {
                        ExerciseId = 28, // Bulgarian Split Squat (Safety Bar)
                        Notes = "3 sets of 5-8 reps",
                        WeightUnit = WeightUnit.Lbs,
                        Sets =
                        [
                            new Set { Reps = 8, Weight = 225, Rpe = 8 },
                            new Set { Reps = 7, Weight = 225, Rpe = 8.5 },
                            new Set { Reps = 6, Weight = 225, Rpe = 9 },
                        ]
                    }
                ]
            }
        ];
    }
}