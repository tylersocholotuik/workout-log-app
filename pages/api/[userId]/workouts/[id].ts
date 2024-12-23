import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await getWorkout(req, res)
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const getWorkout = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, id } = req.query
      
    // Validate and cast userId to string
    if (typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid userId parameter' });
    }

    const workout = await prisma.workout.findUnique({
      where: {
        id: parseInt(id as string),  
        userId, 
        deleted: false,
      },
      include: {
        exercises: {
          include: {
            sets: true
          }
        }
      }
    })
    
    // filter out exercises and sets that are deleted
    if (workout) {
      workout.exercises = workout.exercises.filter((exercise) => {
        exercise.sets = exercise.sets.filter((set) => {
          return !set.deleted
        })
        return !exercise.deleted
      })
    } 

    return res.status(200).json(workout);

  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
}