import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import { exerciseData } from './data/exerciseData';
import { workoutData } from './data/workoutData';

interface Exercise {
    name: string
    id?: number 
}

interface Set {
    weight: number
    reps: number
    rpe: number
    deleted: boolean
}

interface ExerciseInWorkout {
    exerciseId: number
    notes: string
    weightUnit: string
    sets: Set[]
}

interface Workout {
    title: string
    notes: string
    date: Date
    exercises: ExerciseInWorkout[]
}

async function seedDatabase(exerciseData: Exercise[], workoutData: Workout) {

    const { title, notes, date, exercises } = workoutData;

    for (const exercise of exerciseData) {
        await prisma.exercise.create({
            data: {
                name: exercise.name, 
            }
        });
    }

    await prisma.workout.create({
        data: {
            title,
            notes,
            date,
            deleted: false,
            userId: "b24993de-ff97-4547-87d0-9997638c319b",
            exercises: {
                create: exercises.map((exercise) => ({
                    exercise: {
                        connect: { id: exercise.exerciseId }, // Connect an existing exercise by ID
                    },
                    notes: exercise.notes,
                    weightUnit: exercise.weightUnit,
                    sets: {
                        create: exercise.sets.map((set) => ({
                            weight: set.weight,
                            reps: set.reps,
                            rpe: set.rpe,
                            deleted: set.deleted
                        })),
                    },
                    deleted: false
                })),
            },
        },
        include: {
            exercises: {
                include: {
                    exercise: true,
                    sets: true,
                },
            },
        },
    });
}

seedDatabase(exerciseData as Exercise[], workoutData as Workout)
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    })