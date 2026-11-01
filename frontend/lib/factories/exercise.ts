import { Exercise } from '@/types/exercise';

export const createEmptyExercise = (): Exercise => ({
    id: 0,
    name: "",
    exerciseType: "reps",
    userId: null,
    workoutExercises: null
});
