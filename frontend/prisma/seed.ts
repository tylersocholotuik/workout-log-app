import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { exerciseData } from './data/exerciseData';

interface Exercise {
    name: string;
    id?: number;
}

async function seedDatabase(exerciseData: Exercise[]) {
    for (const exercise of exerciseData) {
        await prisma.exercise.create({
            data: {
                name: exercise.name,
            },
        });
    }
}

seedDatabase(exerciseData as Exercise[])
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
