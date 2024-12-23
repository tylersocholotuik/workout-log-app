import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return await getUserExercises(req, res);
  } else if (req.method === "POST") {
    return await addUserExercise(req, res);
  } else if (req.method === "PATCH") {
    return await updateUserExercise(req, res);
  } else if (req.method === "DELETE") {
    return await deleteUserExercise(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST", "PATCH", "DELETE"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// gets all of the user's custom exercises
const getUserExercises = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId } = req.query;

    // Validate and cast userId to string
    if (typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid userId parameter" });
    }

    // return all user exercises that are not deleted
    const exercises = await prisma.userExercise.findMany({
      where: {
        userId,
        deleted: false,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json(exercises);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ error: "Failed to fetch exercises" });
  } finally {
    await prisma.$disconnect();
  }
};

// adds a new custom user exercise and ensures it does not already exist
const addUserExercise = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { userId, name } = req.body;

    // ensure name is not empty string
    if (name.trim() === "") {
      return res.status(400).json({ error: `Exercise name can not be empty.` });
    }

    // Check if the exercise already exists for the user
    const existingUserExercise = await prisma.userExercise.findFirst({
      where: {
        userId,
        name: name.trim(),
      },
    });

    if (existingUserExercise) {
      return res
        .status(400)
        .json({ error: `Exercise '${name}' already exists.` });
    }

    // Create a new user-specific exercise
    const newUserExercise = await prisma.userExercise.create({
      data: {
        userId,
        name: name.trim(),
        deleted: false,
      },
    });

    return res.status(201).json(newUserExercise);
  } catch (error) {
    console.error("Error adding exercise:", error);
    res.status(500).json({ error: "Failed to add exercise" });
  } finally {
    await prisma.$disconnect();
  }
};

const updateUserExercise = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { userId, exerciseId, newName } = req.body;

    // ensure name is not empty string
    if (newName.trim() === "") {
      return res.status(400).json({ error: `Exercise name can not be empty.` });
    }

    // Check if the new name already exists for the user
    const duplicateExercise = await prisma.userExercise.findFirst({
      where: {
        userId,
        name: newName.trim(),
      },
    });

    if (duplicateExercise) {
      return res
        .status(400)
        .json({ error: `Exercise '${newName}' already exists.` });
    }

    // Update the exercise name
    const updatedExercise = await prisma.userExercise.update({
      where: { id: parseInt(exerciseId) },
      data: { name: newName.trim() },
    });

    return res.status(200).json(updatedExercise);
  } catch (error) {
    console.error("Error updating exercise name:", error);
    res.status(500).json({ error: "Failed to update exercise name" });
  } finally {
    await prisma.$disconnect();
  }
};

const deleteUserExercise = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  try {
    const { exerciseId } = req.body;

    // soft delete the exercise
    const deletedExercise = await prisma.userExercise.update({
      where: { id: exerciseId },
      data: { deleted: true },
    });

    return res.status(200).json(deletedExercise);
  } catch (error) {
    console.error("Error deleting exercise: ", error);
    res.status(500).json({ error: "Failed to delete exercise" });
  } finally {
    await prisma.$disconnect();
  }
};
