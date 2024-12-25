import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import ExerciseCard from "@/components/workout/ExerciseCard";
import { Button, Spinner } from "@nextui-org/react";

import {
  getWorkout,
  addWorkout,
  updateWorkout,
  deleteWorkout,
} from "@/utils/api/workouts";

import { Workout, WorkoutExercise, Set, Exercise } from "@/utils/models/models";

export default function WorkoutLog() {
  const [workout, setWorkout] = useState<Workout>(new Workout());
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const { userId, workoutId } = router.query;
  let id = 0;

  if (typeof workoutId === "string") {
    id = parseInt(workoutId);
  }

  useEffect(() => {
    loadWorkout(userId, id);
  }, [router.isReady]);

  const loadWorkout = async (userId: string, workoutId: number) => {
    try {
      // id is greater than 0 if navigating from workout history page
      // load the selected workout. Otherwise, it's a new workout.
      if (id > 0) {
        const data = await getWorkout(userId, workoutId);
        setWorkout(data);
      }
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  const addExercise = () => {
    const updatedWorkout = { ...workout };
    const newWorkoutExercise = new WorkoutExercise();
    newWorkoutExercise.exercise = new Exercise();
    newWorkoutExercise.exercise.name = "test";
    const newSet = {
      // temporary id used for key in loop
      // without this, can't delete correct set index
      // in the deleteSet function in SetsTable component
      tempId: Date.now(),
      id: 0,
      weight: null,
      reps: null,
      rpe: null,
      exerciseId: 0,
      deleted: false,
    };
    newWorkoutExercise.sets.push(newSet);
    updatedWorkout.exercises.push(newWorkoutExercise);
    setWorkout(updatedWorkout);
  };

  const saveWorkout = async (userId: string, workoutData: Workout) => {
    try {
        let newWorkout;
        if (id === 0) {
            newWorkout = await addWorkout(userId, workoutData);
        } else {
            newWorkout = await updateWorkout(userId, workoutData);
        }
        setWorkout(newWorkout);
    } catch (error) {
      // temporary. Add error alert in future.
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center pt-6">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 md:px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {workout.exercises.length > 0 &&
          workout.exercises.map((exercise, index) => {
            return (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                exerciseIndex={index}
                workout={workout}
                setWorkout={setWorkout}
              />
            );
          })}
      </div>
      <div className="flex justify-center mb-8">
        <Button
          color="primary"
          variant="solid"
          radius="full"
          size="md"
          onPress={addExercise}
        >
          Add Exercise
        </Button>
      </div>
      <div className="flex justify-center gap-4 mb-6">
        <Button color="success" variant="flat" radius="full" size="lg" onPress={() => saveWorkout(userId, workout)}>
          Save Workout
        </Button>
        <Button color="danger" variant="flat" radius="full" size="lg">
          Delete Workout
        </Button>
      </div>
    </div>
  );
}
