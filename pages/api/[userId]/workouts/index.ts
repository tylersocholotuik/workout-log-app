import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { Workout, WorkoutExercise, Set } from "@/utils/models/models";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return await getUserWorkouts(req, res);
  } else if (req.method === "POST") {
    return await addWorkout(req, res);
  } else if (req.method === "PATCH") {
    return await updateWorkout(req, res);
  } else if (req.method == "DELETE") {
    return await deleteWorkout(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// gets all of a user's workouts ordered by date from newest to oldest
const getUserWorkouts = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId } = req.query;

    // Validate and cast userId to string
    if (typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid userId parameter" });
    }

    // get all user workouts, ordered by date from newest to oldest
    const workouts = await prisma.workout.findMany({
      where: {
        userId: userId,
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
      orderBy: {
        date: "desc",
      },
    });

    return res.status(200).json(workouts);
  } catch (error) {
    console.error("Error fetching workouts:", error);
    res.status(500).json({ error: "Failed to fetch workouts" });
  } finally {
    await prisma.$disconnect();
  }
};

const addWorkout = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, workoutData } = req.body;

    // temporary, remove after testing
    const existingWorkout = await prisma.workout.findFirst({
      where: { date: workoutData.date, title: workoutData.title },
    });

    if (existingWorkout) {
      return res.status(400).json({ error: "Workout already exists" });
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
            return {
              notes: exercise.notes,
              weightUnit: exercise.weightUnit,
              exerciseId: exercise.exerciseId,
              userExerciseId: exercise.userExerciseId,
              deleted: exercise.deleted,
              sets: {
                create: exercise.sets.map((set) => {
                  return {
                    weight: set.weight,
                    reps: set.reps,
                    rpe: set.rpe,
                    deleted: set.deleted,
                  };
                }),
              },
            };
          }),
        },
      },
      include: {
        exercises: {
          include: {
            exercise: true,
            userExercise: true,
            sets: true,
          },
        },
      },
    });

    return res.status(200).json(newWorkout);
  } catch (error) {
    console.error("Error fetching workouts:", error);
    res.status(500).json({ error: "Failed to fetch workouts" });
  } finally {
    await prisma.$disconnect();
  }
};

const updateWorkout = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { workoutData } = req.body;

    // Fetch the current workout details including exercises and sets
    const currentWorkout = await getWorkout(workoutData.id)

    if (!currentWorkout) {
      throw new Error(`Workout with ID ${workoutData.id} not found.`);
    }

    // Update the workout fields
    await prisma.workout.update({
      where: { id: workoutData.id },
      data: {
        title: workoutData.title,
        notes: workoutData.notes,
        date: workoutData.date,
      },
    });

    // Handle exercises
    const currentExerciseIds = currentWorkout.exercises.map((e) => e.id);

    const incomingExerciseIds = workoutData.exercises
      .map((e: WorkoutExercise) => e.id)
      .filter((id: number) => id !== undefined);

    // Mark missing exercises as deleted
    const exercisesToDelete = currentExerciseIds.filter(
      (id) => !incomingExerciseIds.includes(id)
    );

    await prisma.workoutExercise.updateMany({
      where: {
        id: { in: exercisesToDelete },
      },
      data: { deleted: true },
    });

    // Process each incoming exercise
    for (const exercise of workoutData.exercises) {
      let exerciseId: number;

      if (exercise.id > 0) {
        // Update existing exercise
        await prisma.workoutExercise.update({
          where: { id: exercise.id },
          data: {
            notes: exercise.notes,
            weightUnit: exercise.weightUnit,
            deleted: false,
          },
        });

        exerciseId = exercise.id;
      } else {
        // Create new exercise
        const newExercise = await prisma.workoutExercise.create({
          data: {
            notes: exercise.notes,
            weightUnit: exercise.weightUnit,
            exerciseId: exercise.exerciseId,
            userExerciseId: exercise.userExerciseId,
            workoutId: workoutData.id,
            deleted: false,
          },
        });

        exerciseId = newExercise.id;
      }

      // Handle sets for the current exercise
      const currentSetIds =
        currentWorkout.exercises
          .find((e) => e.id === exerciseId)
          ?.sets.map((s) => s.id) || [];

      const incomingSetIds = exercise.sets
        .map((s: Set) => s.id)
        .filter((id: number) => id !== undefined);

      // Mark missing sets as deleted
      const setsToDelete = currentSetIds.filter(
        (id) => !incomingSetIds.includes(id)
      );

      await prisma.set.updateMany({
        where: {
          id: { in: setsToDelete },
        },
        data: { deleted: true },
      });

      // Process each incoming set
      for (const set of exercise.sets) {
        if (set.id > 0) {
          // Update existing set
          await prisma.set.update({
            where: { id: set.id },
            data: {
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe,
              deleted: set.deleted,
            },
          });
        } else {
          // Create new set
          await prisma.set.create({
            data: {
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe,
              exerciseId,
              deleted: false,
            },
          });
        }
      }
    }

    const updatedWorkout = await getWorkout(workoutData.id);

    return res.status(200).json(updatedWorkout);
  } catch (error) {
    console.error("Error updating workout:", error);
    res.status(500).json({ error: "Failed to update workout" });
  } finally {
    await prisma.$disconnect();
  }
};

const deleteWorkout = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { id } = req.body;

    // soft delete by setting deleted to true
    const deletedWorkout = await prisma.workout.update({
      where: { id },
      data: {
        deleted: true,
      },
    });

    return res.status(200).json(deletedWorkout);
  } catch (error) {
    console.error("Error deleting workout:", error);
    res.status(500).json({ error: "Failed to delete workout" });
  } finally {
    await prisma.$disconnect();
  }
};

const getWorkout = async (id: number) => {
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      exercises: {
        where: {
          deleted: false,
        },
        include: {
          exercise: true,
          userExercise: true,
          sets: {
            where: {
              deleted: false,
            },
          },
        },
      },
    },
  });

  return workout;
};
