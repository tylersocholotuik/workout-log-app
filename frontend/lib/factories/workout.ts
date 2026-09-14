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
        exercises: []
    };
};

export const createEmptyWorkoutExercise = (): WorkoutExercise => ({
    id: 0,
    notes: "",
    weightUnit: "lbs",
    exerciseId: 0,
    exercise: { id: 0, name: "", userId: null },
    workoutId: "",
    sets: []
});

export const createEmptySet = (): Set => ({
    id: 0,
    weight: null,
    reps: null,
    rpe: null,
    exerciseId: 0
});
