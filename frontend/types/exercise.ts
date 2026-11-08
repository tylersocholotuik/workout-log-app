import {EffortRatingType, ExerciseType, WeightUnit, DistanceUnit} from './common';
import { WorkoutExercise, Set } from './workout';

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
    distanceUnit: DistanceUnit;
    effortType: EffortRatingType;
    exerciseType: ExerciseType;
    workout: {
        date: string;
    };
    sets: Set[];
}
