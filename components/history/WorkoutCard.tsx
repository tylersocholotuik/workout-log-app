import {
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Divider,
    Link,
} from "@nextui-org/react";

export default function WorkoutCard({ workout }) {
    const workoutDate = new Date(workout.date);
    return (
        <Card>
            <CardHeader className="flex justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-md text-primary dark:text-inherit">
                        {workout.title}
                    </h3>
                    <p className="text-small text-default-500">
                        {workoutDate.toLocaleString("en-CA", {
                            dateStyle: "full",
                        })}
                    </p>
                    <p className="text-small text-default-500">
                        <span className="font-bold">Notes: </span>
                        {workout.notes}
                    </p>
                </div>
                <div className=""></div>
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
                                {exercise.exercise?.name
                                    ? exercise.exercise.name
                                    : exercise.userExercise?.name &&
                                      exercise.userExercise.name}
                            </li>
                        );
                    })}
                </ul>
            </CardBody>
            <Divider />
            <CardFooter>
                <Link
                    showAnchorIcon
                    isBlock
                    href={`/${workout.userId}/workout/${workout.id}`}
                >
                    View/Edit
                </Link>
            </CardFooter>
        </Card>
    );
}
