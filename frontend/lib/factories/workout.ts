import { Workout, WorkoutExercise, Set } from '@/types/workout';
import { getTodayWorkoutDate } from '@/utils/workoutDate';

export const createEmptyWorkout = (): Workout => {
    const date = getTodayWorkoutDate();

    return {
        id: "",
        title: `${new Date().toLocaleDateString("en-CA", {
            dateStyle: "short",
        })} Workout`,
        notes: "",
        date,
        userId: "",
        finishedAt: null,
        exercises: []
    };
};

export const createEmptyWorkoutExercise = (): WorkoutExercise => ({
    id: 0,
    notes: "",
    weightUnit: "lbs",
    effortType: "rpe",
    exerciseId: 0,
    exercise: { id: 0, name: "", userId: null },
    workoutId: "",
    sets: [],
    targetAppliesToAllSets: false,
});

export const createEmptySet = (): Set => ({
    id: 0,
    weight: null,
    reps: null,
    effortRating: null,
    exerciseId: 0,
    targetRepsMin: null,
    targetRepsMax: null,
    targetEffortMin: null,
    targetEffortMax: null
});
