import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {      
      const workouts = await prisma.workout.findMany({
        include: {
          user: true,
          exercises: {
            include: {
              exercise: true,
              sets: true,
            },
          },
        },
      });

      res.status(200).json(workouts);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      res.status(500).json({ error: 'Failed to fetch workouts' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}