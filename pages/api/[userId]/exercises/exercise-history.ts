import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { userId, exerciseId, userExerciseId } = req.query;

        if (typeof userId !== "string") {
            return res.status(400).json({ error: "Invalid userId parameter" });
        }

        let exerciseHistory;

        // gets a list of every time the user performed the selected exercise in a workout,
        // and returns the date, notes, and sets.
        if (exerciseId) {
            exerciseHistory = await prisma.workoutExercise.findMany({
                where: {
                    workout: {
                        userId: userId,
                        deleted: false
                    },
                    exercise: {
                        id: Number(exerciseId),
                    },
                    deleted: false,
                },
                select: {
                  notes: true,
                  weightUnit: true, 
                  workout: {
                    select: {
                      date: true
                    }
                  },
                  sets: {
                    where: {
                      deleted: false
                    },
                    select: {
                      weight: true,
                      reps: true,
                      rpe: true,
                    }
                  }
                },
            });
        }

        if (userExerciseId) {
            exerciseHistory = await prisma.workoutExercise.findMany({
                where: {
                    workout: {
                        userId: userId,
                        deleted: false
                    },
                    userExercise: {
                        id: Number(userExerciseId),
                    },
                    deleted: false,
                },
                select: {
                  notes: true,
                  weightUnit: true, 
                  workout: {
                    select: {
                      date: true
                    }
                  },
                  sets: {
                    where: {
                      deleted: false
                    },
                    select: {
                      weight: true,
                      reps: true,
                      rpe: true,
                    }
                  }
                },
            });
        }
        return res.status(200).json(exerciseHistory);
    } catch (error) {
        console.error("Error fetching exercises:", error);
        res.status(500).json({ error: "Failed to fetch exercises" });
    } finally {
        await prisma.$disconnect();
    }
}
