import { WeightUnit } from './common';
import { Exercise } from './exercise';

export interface Workout {
    id: string;
    title: string;
    notes: string;
    date: Date;
    userId: string;
    exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
    id: number;
    notes: string;
    weightUnit: WeightUnit;
    exerciseId: number;
    exercise: Exercise;
    workoutId: string;
    sets: Set[];
}

export interface Set {
    id: number;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    exerciseId: number;
}
