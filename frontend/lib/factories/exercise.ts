import { Exercise } from '@/types/exercise';

export const createEmptyExercise = (): Exercise => ({
    id: 0,
    name: "",
    userId: null,
    workoutExercises: null
});
