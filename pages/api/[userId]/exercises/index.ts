import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query

      // Validate and cast userId to string
      if (typeof userId !== 'string') {
        return res.status(400).json({ error: 'Invalid userId parameter' });
      }

      // return all user exercises that are not deleted
      const exercises = await prisma.userExercise.findMany({
        where: {
          userId, 
          deleted: false,
        },
        orderBy: {
            name: 'asc'
        }
      });

      return res.status(200).json(exercises);

    } catch (error) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({ error: 'Failed to fetch exercises' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}