import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async function () {
    const getExerciseHistory = async (
        userId: string,
        exerciseId?: number,
        userExerciseId?: number
    ) => {
        try {
            let exerciseHistory;

            if (exerciseId) {
                exerciseHistory = await prisma.workout.findMany({
                    where: {
                        userId,
                        deleted: false,
                    },
                    select: {
                        exercises: {
                            where: {
                                exercise: {
                                    id: exerciseId,
                                },
                            },
                        },
                    },
                });
            }

            if (userExerciseId) {
                exerciseHistory = await prisma.workout.findMany({
                    where: {
                        userId,
                        deleted: false,
                    },
                    select: {
                        exercises: {
                            where: {
                                userExercise: {
                                    id: userExerciseId,
                                },
                            },
                        },
                    },
                });
            }

            return exerciseHistory;
        } catch (error) {
            console.error("Error fetching exercises:", error);
        } finally {
            await prisma.$disconnect();
        }
    };

    const data = await getExerciseHistory("b24993de-ff97-4547-87d0-9997638c319b", 178);

    console.log(data);
})();
