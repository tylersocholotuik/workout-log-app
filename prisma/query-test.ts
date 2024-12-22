import { PrismaClient } from "@prisma/client";
import { workoutDataUpdate } from "./data/workoutData2Update";
const prisma = new PrismaClient();

async function updateWorkout(workoutData) {
  const workoutId = 2

  // Fetch the current workout details including exercises and sets
  const currentWorkout = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
  });

  if (!currentWorkout) {
    throw new Error(`Workout with ID ${workoutId} not found.`);
  }

  // Update the workout fields
  await prisma.workout.update({
    where: { id: workoutId },
    data: {
      title: workoutData.title,
      notes: workoutData.notes,
      date: workoutData.date,
    },
  });

  // Handle exercises
  const currentExerciseIds = currentWorkout.exercises
    .filter((e) => !e.deleted)
    .map((e) => e.id)
    
  const incomingExerciseIds = workoutData.exercises
    .map((e) => e.id)
    .filter((id) => id !== undefined);

  // Mark missing exercises as deleted
  const exercisesToDelete = currentExerciseIds.filter(
    (id) => !incomingExerciseIds.includes(id)
  )

  await prisma.workoutExercise.updateMany({
    where: {
      id: { in: exercisesToDelete },
    },
    data: { deleted: true },
  })

  // Process each incoming exercise
  for (const exercise of workoutData.exercises) {
    let exerciseId: number;

    if (exercise.id) {
      // Update existing exercise
      await prisma.workoutExercise.update({
        where: { id: exercise.id },
        data: {
          notes: exercise.notes,
          weightUnit: exercise.weightUnit,
          deleted: false,
        },
      })

      exerciseId = exercise.id;
    } else {
      // Create new exercise
      const newExercise = await prisma.workoutExercise.create({
        data: {
          notes: exercise.notes,
          weightUnit: exercise.weightUnit,
          exerciseId: exercise.exerciseId,
          userExerciseId: exercise.userExerciseId,
          workoutId: workoutId,
          deleted: false
        },
      })

      exerciseId = newExercise.id;
    }

    // Handle sets for the current exercise
    const currentSetIds =
      currentWorkout.exercises
        .find((e) => e.id === exerciseId)
        ?.sets
          .filter((s) => !s.deleted)
          .map((s) => s.id) || []

    const incomingSetIds = exercise.sets
      .map((s) => s.id)
      .filter((id) => id !== undefined)

    // Mark missing sets as deleted
    const setsToDelete = currentSetIds.filter(
      (id) => !incomingSetIds.includes(id)
    )

    await prisma.set.updateMany({
      where: {
        id: { in: setsToDelete },
      },
      data: { deleted: true },
    })

    // Process each incoming set
    for (const set of exercise.sets) {
      if (set.id) {
        // Update existing set
        await prisma.set.update({
          where: { id: set.id },
          data: {
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            deleted: set.deleted,
          },
        })
      } else {
        // Create new set
        await prisma.set.create({
          data: {
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            exerciseId,
            deleted: false
          },
        });
      }
    }
  }
}

async function getWorkout(workoutId: number) {
    const workout = await prisma.workoutExercise.findMany({
        where: { workoutId: workoutId},
        include: {
            sets: {
                select: {
                    weight: true,
                    reps: true,
                    rpe: true
                }
            }
        }
    })

    console.log(workout)
}

async function getSets(exerciseId: number) {
  const exercises = await prisma.workoutExercise.findMany({
    where: { exerciseId },
    select: {
      sets: true
    }
  })

  exercises.forEach((exercise) => {
    exercise.sets.forEach((set) => {
      console.log(set)
    })
  })
}

updateWorkout(workoutDataUpdate)
  .catch((e) => {
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect;
  });

  // getWorkout(2)
  // .catch((e) => {
  //   console.error(e.message);
  // })
  // .finally(async () => {
  //   await prisma.$disconnect;
  // });

  // getSets(32)
  // .catch((e) => {
  //   console.error(e.message);
  // })
  // .finally(async () => {
  //   await prisma.$disconnect;
  // });
