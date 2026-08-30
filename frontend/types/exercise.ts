import { WeightUnit } from './common';
import { WorkoutExercise } from './workout';

export interface Exercise {
    id: number;
    name: string;
    userId?: string | null;
    deleted?: boolean;
    workoutExercises?: WorkoutExercise[] | null;
}

export interface UserExercise {
    id: number;
    name: string;
    userId: string;
    deleted: boolean;
    workoutExercises?: WorkoutExercise[] | null;
}

export interface ExerciseHistory {
    notes: string;
    weightUnit: WeightUnit;
    workout: {
        date: string;
    };
    sets: [
        {
            weight: number;
            reps: number;
            rpe: number;
        }
    ];
}
