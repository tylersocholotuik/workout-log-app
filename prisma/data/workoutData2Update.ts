export const workoutDataUpdate = {
    id: 2,
    title: 'Full Body Workout B',
    notes: 'test update',
    date: new Date('2024-12-12'),
    userId: 'cm4zr6sti0000priwve9whn6t',
    deleted: false,
    exercises: [
        {
            id: 8,
            exerciseId: 5, // (Bench Press (Paused))
            workoutId: 2,
            notes: '3 sets of 5-8 reps',
            weightUnit: 'kg',
            sets: [
                { id: 22, weight: 105, reps: 8, rpe: 8.5, deleted: false },
                { id: 23, weight: 105, reps: 6, rpe: 8.5, deleted: false },
                { id: 24, weight: 105, reps: 5, rpe: 8.5, deleted: false },
            ],
            deleted: false
        },
        // deleted
        // {
        //     id: 9,
        //     exerciseId: 144, // (Row (Cable))
        //     workoutId: 2,
        //     notes: '2 sets of 8-12 reps',
        //     weightUnit: 'lbs',
        //     sets: [
        //         { id: 25, weight: 210, reps: 12, rpe: 10, deleted: false },
        //         { id: 26, weight: 210, reps: 9, rpe: 10, deleted: false },
        //     ],
        //     deleted: false
        // },
        {
            id: 14,
            exerciseId: 154, // (Row (T-bar, Chest-Supported))
            workoutId: 2,
            notes: '2 sets of 8-12 reps',
            weightUnit: 'lbs',
            sets: [
                { weight: 145, reps: 12, rpe: 10, deleted: false },
                { weight: 145, reps: 9, rpe: 10, deleted: false },
            ],
            deleted: false
        },
        {
            id: 10,
            exerciseId: 36, // (Chest Fly (Dumbbell))
            workoutId: 2,
            notes: '2 sets of 8-12 reps',
            weightUnit: 'lbs',
            sets: [
                { id: 27, weight: 40, reps: 12, rpe: 10, deleted: false },
                { id: 28, weight: 40, reps: 9, rpe: 10, deleted: false },
            ],
            deleted: false
        },
        {
            id: 11,
            exerciseId: 122, // (Pullover (Dumbbell))
            workoutId: 2,
            notes: '2 sets of 8-12 reps',
            weightUnit: 'lbs',
            sets: [
                { id: 29, weight: 75, reps: 12, rpe: 9, deleted: false },
                { id: 30, weight: 75, reps: 10, rpe: 10, deleted: false },
            ],
            deleted: false
        },
        {
            id: 12,
            exerciseId: 32, // (Calf Raise (Machine))
            workoutId: 2,
            notes: '3 sets of 8-15 reps',
            weightUnit: 'lbs',
            sets: [
                { id: 31, weight: 350, reps: 16, rpe: 8, deleted: false },
                { id: 32, weight: 350, reps: 13, rpe: 9, deleted: false },
                { id: 33, weight: 350, reps: 12, rpe: 10, deleted: false },
            ],
            deleted: false
        },
        {
            id: 13,
            exerciseId: 29, // (Bulgarian Split Squat (Smith Machine))
            workoutId: 2,
            notes: '3 sets of 6-8 reps',
            weightUnit: 'lbs',
            sets: [
                { id: 35, weight: 210, reps: 8, rpe: 7, deleted: false },
                { id: 36, weight: 210, reps: 8, rpe: 8, deleted: false },
                { weight: 210, reps: 7, rpe: 9, deleted: false },
            ],
            deleted: false
        },
    ],
}