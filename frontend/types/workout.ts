import { WeightUnit, EffortRatingType } from './common';
import { Exercise } from './exercise';

export interface Workout {
    id: string;
    title: string;
    notes: string;
    date: string;
    userId: string;
    finishedAt: string | null;
    exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
    id: number;
    notes: string;
    weightUnit: WeightUnit;
    effortType: EffortRatingType;
    exerciseId: number;
    exercise: Exercise;
    workoutId: string;
    sets: Set[];
}

export interface Set {
    id: number;
    weight: number | null;
    reps: number | null;
    effortRating: number | null;
    exerciseId: number;
}
