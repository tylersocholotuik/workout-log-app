import { WeightUnit } from './common';
import { Exercise, UserExercise } from './exercise';

export interface Workout {
    id: string;
    title: string;
    notes: string;
    date: Date;
    userId: string;
    exercises: WorkoutExercise[];
    deleted: boolean;
}

export interface WorkoutExercise {
    id: number;
    notes: string;
    weightUnit: WeightUnit;
    exerciseId: number | null;
    userExerciseId: number | null;
    exercise: Exercise | null;
    userExercise: UserExercise | null;
    workoutId: string;
    sets: Set[];
    deleted: boolean;
}

export interface Set {
    id: number;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    exerciseId: number;
    deleted: boolean;
}
