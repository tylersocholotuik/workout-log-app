import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client'
import { Workout, Exercise, Set } from '@/utils/models/models';

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await getUserWorkouts(req, res);
  } else if (req.method === 'POST') {
    return await addWorkout(req, res);
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// gets all of a user's workouts ordered by date from newest to oldest
const getUserWorkouts = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId } = req.query

    // Validate and cast userId to string
    if (typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid userId parameter' });
    }

    // get all user workouts, ordered by date from newest to oldest
    const workouts = await prisma.workout.findMany({
      where: {
        userId: userId, 
        deleted: false,
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true,
          },
        },
      },
      orderBy: {
        date: 'desc'
      }
    });

    return res.status(200).json(workouts);

  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  } finally {
    await prisma.$disconnect()
  }
}

const addWorkout = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, workoutData } = req.body;

    // temporary, remove after testing
    const existingWorkout = await prisma.workout.findFirst({
      where: { date: workoutData.date, title: workoutData.title }
    })

    if (existingWorkout) {
      return res.status(400).json({ error: 'Workout already exists' });
    }

    const newWorkout = await prisma.workout.create({
      data: {
        title: workoutData.title,
        notes: workoutData.notes,
        date: workoutData.date,
        userId: userId,
        deleted: workoutData.deleted,
        exercises: {
          create: workoutData.exercises.map((exercise) => {
            return ({
              notes: exercise.notes,
              weightUnit: exercise.weightUnit,
              exerciseId: exercise.exerciseId,
              userExerciseId: exercise.userExerciseId,
              deleted: exercise.deleted,
              sets: {
                create: exercise.sets.map((set) => {
                  return ({
                    weight: set.weight,
                    reps: set.reps,
                    rpe: set.rpe,
                    deleted: set.deleted
                  })
                })
              }
            })
          })
        }
      },
      include: {
        exercises: {
          include: {
            sets: true
          }
        }
      }
    })

    return res.status(200).json(newWorkout)
    
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  } finally {
    await prisma.$disconnect()
  }
}