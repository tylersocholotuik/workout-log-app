import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
} from "@nextui-org/react";

import { DeleteIcon } from "@/icons/DeleteIcon";

import SetsTable from "./SetsTable";

import { WorkoutExercise, Set } from "@/utils/models/models";

export default function ExerciseCard({
  exercise,
  exerciseIndex,
  workout,
  setWorkout,
}) {
  const addSet = () => {
    const newSet = {
      // temporary id used for key in loop
      // without this, can't delete correct set index
      // in the deleteSet function in SetsTable component
      tempId: Date.now(),
      id: 0,
      weight: null,
      reps: null,
      rpe: null,
      exerciseId: exercise.id,
      deleted: false,
    };

    // creating a deep copy of workout, then adding a new set
    // to the exercise at the current exercise index
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: [...exercise.sets, newSet],
            }
          : exercise
      ),
    };
    setWorkout(updatedWorkout);
  };

  const deleteExercise = () => {
    const updatedWorkout = {
      ...workout,
      exercises: workout.exercises.filter((_, i) => i !== exerciseIndex),
    };
    setWorkout(updatedWorkout);
  };

  return (
    <Card classNames={{ footer: "justify-center py-2" }}>
      <CardHeader className="flex justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-md">{exercise.exercise.name}</h3>
          <p className="text-small text-default-500">
            <span className="font-bold">Notes: </span>
            {exercise.notes}
          </p>
        </div>
        <div className="">
          <Button
            isIconOnly
            aria-label="delete set"
            color="danger"
            variant="light"
            onPress={deleteExercise}
          >
            <DeleteIcon />
          </Button>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <SetsTable
          sets={exercise.sets}
          weightUnit={exercise.weightUnit}
          exerciseIndex={exerciseIndex}
          workout={workout}
          setWorkout={setWorkout}
        />
      </CardBody>
      <CardFooter>
        <Button color="primary" variant="light" onPress={addSet}>
          Add Set
        </Button>
      </CardFooter>
    </Card>
  );
}
