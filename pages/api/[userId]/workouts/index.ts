import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client'
import { Workout, Exercise, Set } from '@/types';

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await getUserWorkouts(req, res);
  } else if (req.method === 'POST') {

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
  }
}

const addWorkout = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, workoutData } = req.body;

    
  } catch (error) {
    
  }
}