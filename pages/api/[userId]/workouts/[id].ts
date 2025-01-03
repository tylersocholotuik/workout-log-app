import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return await getWorkout(req, res);
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const getWorkout = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, id } = req.query;

    if (typeof id !== "string") {
      return res.status(400).json({ error: "Invalid workoutId parameter" });
    }

    if (typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid userId parameter" });
    }

    const workout = await prisma.workout.findUnique({
      where: {
        id: id,
        userId,
        deleted: false,
      },
      include: {
        exercises: {
          where: {
            deleted: false,
          },
          orderBy: {
            id: 'asc'
          },
          include: {
            exercise: true,
            userExercise: true,
            sets: {
              where: {
                deleted: false,
              },
              orderBy: {
                id: 'asc'
              },
            },
          },
        },
      },
    });

    return res.status(200).json(workout);
  } catch (error) {
    console.error("Error fetching workouts:", error);
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
};
