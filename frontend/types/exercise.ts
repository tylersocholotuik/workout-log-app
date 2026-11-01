import {EffortRatingType, ExerciseType, WeightUnit} from './common';
import { WorkoutExercise } from './workout';

export interface Exercise {
    id: number;
    name: string;
    exerciseType: ExerciseType;
    userId: string | null;
    workoutExercises?: WorkoutExercise[] | null;
}

export interface ExerciseHistory {
    notes: string;
    weightUnit: WeightUnit;
    effortType: EffortRatingType;
    exerciseType: ExerciseType;
    workout: {
        date: string;
    };
    sets: [
        {
            weight: number;
            reps: number;
            effortRating: number;
        }
    ];
}
