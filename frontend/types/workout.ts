import { WeightUnit, DistanceUnit, EffortRatingType } from './common';
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
    distanceUnit: DistanceUnit;
    effortType: EffortRatingType;
    exerciseId: number;
    exercise: Exercise;
    workoutId: string;
    sets: Set[];
    // frontend-only, not persisted: true when "All" was explicitly selected for a target
    targetAppliesToAllSets?: boolean;
}

export interface Set {
    id: number;
    weight: number | null;
    reps: number | null;
    distance: number | null;
    durationSeconds: number | null;
    effortRating: number | null;
    exerciseId: number;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    targetDistanceMin: number | null;
    targetDistanceMax: number | null;
    targetSecondsMin: number | null;
    targetSecondsMax: number | null;
    targetEffortMin: number | null;
    targetEffortMax: number | null;
}

// a group of sets (by index) sharing identical target values, so they can be
// edited together via a multi-select input
export interface SetTargets {
    setIndices: number[];
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    targetDistanceMin: number | null;
    targetDistanceMax: number | null;
    targetSecondsMin: number | null;
    targetSecondsMax: number | null;
    targetEffortMin: number | null;
    targetEffortMax: number | null;
}
