import { Card, CardHeader, CardBody, CardFooter, Divider, Link } from "@nextui-org/react";

export default function WorkoutCard({ workout }) {
    const workoutDate = new Date(workout.date);
  return (
    <Card>
      <CardHeader className="flex justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-md font-bold">{workout.title}</h3>
          <p className="text-small">{workoutDate.toLocaleString('en-CA', {dateStyle: 'full'})}</p>
          <p className="text-small">Notes: <span className="text-default-500">Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis maiores sint mollitia iure velit at adipisci nemo molestias, officiis dolore incidunt id, aut eveniet dolores fugit necessitatibus eligendi rerum sit?</span></p>
        </div>
        <div className="">
            
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <h4 className="text-small mb-2">Exercises:</h4>
        <ul className="list-disc list-inside">
            {workout.exercises.map((exercise) => {
                return <li key={exercise.exercise.name} className="text-xs text-default-500">
                    {exercise.exercise.name}
                </li>
            })}
        </ul>
      </CardBody>
      <Divider />
      <CardFooter>
            <Link showAnchorIcon isBlock href="#">
                View/Edit
            </Link>
      </CardFooter>
    </Card>
  );
}
