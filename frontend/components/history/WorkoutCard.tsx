import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Chip,
    Divider,
    Link,
} from "@heroui/react";

import { Workout } from "@/types";
import { formatWorkoutDate } from "@/utils/workoutDate";

interface WorkoutCardProps {
    workout: Workout;
}

export default function WorkoutCard({ workout }: WorkoutCardProps) {
    const isInProgress = !workout.finishedAt;
    
    return (
        <Card>
            <CardHeader className="flex justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-md text-primary dark:text-inherit">
                        {workout.title}
                    </h3>
                    <p className="text-small text-default-500">
                        {formatWorkoutDate(workout.date, {
                            dateStyle: "full",
                        })}
                    </p>
                    {workout.notes && (
                        <p className="text-small text-default-500">
                            <span className="font-bold">Notes: </span>
                            {workout.notes}
                        </p>
                    )}
                </div>
                {isInProgress && (
                    <Chip color="warning" variant="dot">
                        In Progress
                    </Chip>
                )}
            </CardHeader>
            <Divider />
            <CardBody>
                <h4 className="text-small mb-2">Exercises:</h4>
                <ul className="list-disc list-inside">
                    {workout.exercises.map((exercise) => {
                        return (
                            <li
                                key={exercise.id}
                                className="text-xs text-default-500"
                            >
                                {exercise.exercise.name}
                            </li>
                        );
                    })}
                </ul>
            </CardBody>
            <Divider />
            <CardFooter>
                <Link showAnchorIcon isBlock href={`/workout/${workout.id}`}>
                    {isInProgress ? "Continue Workout" : "View/Edit"}
                </Link>
            </CardFooter>
        </Card>
    );
}
