import { Workout, WorkoutExercise, Set } from '@/types/workout';

export const createEmptyWorkout = (): Workout => ({
    id: "",
    title: `${new Date().toLocaleString("en-CA", {
        dateStyle: "short",
    })} Workout`,
    notes: "",
    date: new Date(),
    userId: "",
    exercises: [],
    deleted: false
});

export const createEmptyWorkoutExercise = (): WorkoutExercise => ({
    id: 0,
    notes: "",
    weightUnit: "lbs",
    exerciseId: null,
    userExerciseId: null,
    exercise: null,
    userExercise: null,
    workoutId: "",
    sets: [],
    deleted: false
});

export const createEmptySet = (): Set => ({
    id: 0,
    weight: null,
    reps: null,
    rpe: null,
    exerciseId: 0,
    deleted: false
});
