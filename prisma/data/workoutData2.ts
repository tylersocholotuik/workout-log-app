import { Workout } from "@/utils/models/models"

export const workoutData: Workout = {
    title: 'Full Body Workout B',
    notes: '',
    date: new Date('2024-12-12'),
    deleted: false,
    exercises: [
        {
            exerciseId: 5, // (Bench Press (Paused))
            notes: '3 sets of 5-8 reps',
            weightUnit: 'kg',
            sets: [
                { weight: 105, reps: 8, rpe: 8.5, deleted: false },
                { weight: 105, reps: 6, rpe: 8.5, deleted: false },
                { weight: 105, reps: 5, rpe: 8.5, deleted: false },
            ],
            deleted: false
        },
        {
            exerciseId: 144, // (Row (Cable))
            notes: '2 sets of 8-12 reps',
            weightUnit: 'lbs',
            sets: [
                { weight: 210, reps: 12, rpe: 10, deleted: false },
                { weight: 210, reps: 9, rpe: 10, deleted: false },
            ],
            deleted: false
        },
        {
            exerciseId: 36, // (Chest Fly (Dumbbell))
            notes: '2 sets of 8-12 reps',
            weightUnit: 'lbs',
            sets: [
                { weight: 40, reps: 12, rpe: 10, deleted: false },
                { weight: 40, reps: 9, rpe: 10, deleted: false },
            ],
            deleted: false
        },
        {
            exerciseId: 122, // (Pullover (Dumbbell))
            notes: '2 sets of 8-12 reps',
            weightUnit: 'lbs',
            sets: [
                { weight: 75, reps: 12, rpe: 9, deleted: false },
                { weight: 75, reps: 10, rpe: 10, deleted: false },
            ],
            deleted: false
        },
        {
            exerciseId: 32, // (Calf Raise (Machine))
            notes: '4 sets of 8-15 reps',
            weightUnit: 'lbs',
            sets: [
                { weight: 350, reps: 16, rpe: 8, deleted: false },
                { weight: 350, reps: 13, rpe: 9, deleted: false },
                { weight: 350, reps: 12, rpe: 10, deleted: false },
                { weight: 350, reps: 11, rpe: 10, deleted: false },
            ],
            deleted: false
        },
        {
            exerciseId: 29, // (Bulgarian Split Squat (Smith Machine))
            notes: '2 sets of 6-8 reps',
            weightUnit: 'lbs',
            sets: [
                { weight: 210, reps: 8, rpe: 7, deleted: false },
                { weight: 210, reps: 8, rpe: 8, deleted: false },
            ],
            deleted: false
        },
    ],
}