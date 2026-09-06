import { WeightUnit } from './common';
import { WorkoutExercise } from './workout';

export interface Exercise {
    id: number;
    name: string;
    userId: string | null;
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
