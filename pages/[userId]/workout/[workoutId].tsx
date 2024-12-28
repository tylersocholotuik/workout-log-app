import { useEffect, useState, createContext } from "react";
import { useRouter } from "next/router";

import DeleteWorkoutModal from "@/components/workout/DeleteWorkoutModal";
import ExerciseCard from "@/components/workout/ExerciseCard";
import SelectExerciseModal from "@/components/workout/SelectExerciseModal";
import WorkoutDetailsModal from "@/components/workout/WorkoutDetailsModal";

import { Alert, Button, Spinner, useDisclosure } from "@nextui-org/react";

import { EditIcon } from "@/icons/EditIcon";

import {
    getWorkout,
    addWorkout,
    updateWorkout,
    deleteWorkout,
} from "@/utils/api/workouts";

import {
    Workout,
    WorkoutExercise,
    Set,
    Exercise,
    UserExercise,
} from "@/utils/models/models";

export const WorkoutContext = createContext({});

export default function WorkoutLog() {
    const [workout, setWorkout] = useState<Workout>(new Workout());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");
    const [startNewWorkout, setStartNewWorkout] = useState(false);

    const detailsModal = useDisclosure();
    const deleteModal = useDisclosure();
    const addExerciseModal = useDisclosure();

    const router = useRouter();

    const { userId, workoutId } = router.query;
    let id = 0;

    if (typeof workoutId === "string") {
        id = parseInt(workoutId);
    }

    useEffect(() => {
        if (!router.isReady || !workoutId) return;

        loadWorkout(userId, id);
        console.log(id);
    }, [router.isReady, workoutId]);

    const loadWorkout = async (
        userId: string | string[] | undefined,
        workoutId: number
    ) => {
        // id is greater than 0 if navigating from workout history page
        // load the selected workout. Otherwise, it's a new workout.
        if (id > 0) {
            try {
                const data = await getWorkout(userId, workoutId);
                console.log(data);
                setWorkout(data);
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                }
            }
        }

        setIsLoading(false);
    };

    const addExercise = (exercise: Exercise | UserExercise) => {
        const updatedWorkout = { ...workout };
        const newWorkoutExercise = new WorkoutExercise();
        // if userId is present, that means it is a user exercise
        if ("userId" in exercise) {
            newWorkoutExercise.userExerciseId = exercise.id;
            newWorkoutExercise.userExercise = exercise;
        } else {
            newWorkoutExercise.exerciseId = exercise.id;
            newWorkoutExercise.exercise = exercise;
        }
        newWorkoutExercise.workoutId = workout.id;
        // automatically add an empty set when adding a new exercise
        const newSet = new Set();
        newWorkoutExercise.sets.push(newSet);
        updatedWorkout.exercises.push(newWorkoutExercise);

        setWorkout(updatedWorkout);
    };

    const saveWorkout = async (
        userId: string | string[] | undefined,
        workoutData: Workout
    ) => {
        try {
            setFeedback("");
            setError("");
            setIsSaving(true);

            let newWorkout: Workout;

            if (id === 0) {
                newWorkout = await addWorkout(userId, workoutData);
                setFeedback("Workout Saved");
                // reload the page with the new workoutId
                await router.push(`/${userId}/workout/${newWorkout.id}`);
            } else {
                newWorkout = await updateWorkout(userId, workoutData);
                setWorkout(newWorkout);
                setFeedback("Workout Updated!");
            }
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const discardWorkout = async (
        userId: string | string[] | undefined,
        workoutId: number
    ) => {
        let success = false;

        setFeedback("");
        setError("");

        if (workoutId === 0) {
            // if it is a new unsaved workout, simply initialize a
            // new workout
            setWorkout(new Workout());
            setStartNewWorkout(false);
        } else {
            try {
                setIsDeleting(true);

                await deleteWorkout(userId, workoutId);

                setFeedback(`'${workout.title}' was deleted`);

                success = true;
            } catch (error) {
                if (error instanceof Error) {
                    setError(error.message);
                }
            } finally {
                setIsDeleting(false);
                if (success) {
                    setWorkout(new Workout());
                    setStartNewWorkout(false);
                    router.push(`/${userId}/workout/0`);
                }
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center pt-6">
                <Spinner size="lg" />
            </div>
        );
    }

    // if navigating directly to workout page, prompt user to either start a new workout
    // or load an existing workout
    if (id === 0 && !startNewWorkout) {
        return (
            <div className="container mx-auto px-2 md:px-4 py-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                    <div>
                        <Button
                            color="primary"
                            size="lg"
                            variant="solid"
                            onPress={() => setStartNewWorkout(true)}
                        >
                            Start New Workout
                        </Button>
                    </div>
                    <div>
                        <Button
                            color="primary"
                            size="lg"
                            variant="solid"
                            onPress={() => router.push(`/${userId}/history`)}
                        >
                            Load Existing Workout
                        </Button>
                    </div>
                </div>
                <div className="flex justify-center mb-6">
                    {feedback !== "" && (
                        <div className="w-[320px]">
                            <Alert
                                color="success"
                                description={feedback}
                                isVisible={feedback !== ""}
                                title="Success"
                                variant="faded"
                                onClose={() => setFeedback("")}
                            />
                        </div>
                    )}
                    {error !== "" && (
                        <div className="w-[320px]">
                            <Alert
                                color="danger"
                                description={error}
                                isVisible={error !== ""}
                                title="Error"
                                variant="faded"
                                onClose={() => setError("")}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <WorkoutContext.Provider value={{ workout, setWorkout }}>
            <div className="container mx-auto px-2 md:px-4 py-6">
                <div className="flex flex-col gap-2 items-center mb-6">
                    <h2 className="text-lg">{workout.title}</h2>
                    <p className="text-md">
                        {new Date(workout.date).toLocaleString("en-CA", {
                            dateStyle: "full",
                        })}
                    </p>
                    <div className="max-w-[400px] text-center">
                        <p className="text-md text-default-500">
                            <span className="font-bold">Notes: </span>
                            {workout.notes}
                        </p>
                    </div>
                    <div>
                        <Button
                            color="primary"
                            variant="light"
                            size="md"
                            startContent={<EditIcon />}
                            onPress={detailsModal.onOpen}
                        >
                            Edit Details
                        </Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    {workout.exercises.length > 0 &&
                        workout.exercises.map((exercise, index) => {
                            return (
                                <ExerciseCard
                                    key={exercise.id}
                                    exercise={exercise}
                                    exerciseIndex={index}
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
                        onPress={addExerciseModal.onOpen}
                    >
                        Add Exercise
                    </Button>
                </div>
                <div className="flex justify-center mb-6">
                    {feedback !== "" && (
                        <div className="w-[320px]">
                            <Alert
                                color="success"
                                description={feedback}
                                isVisible={feedback !== ""}
                                title="Success"
                                variant="faded"
                                onClose={() => setFeedback("")}
                            />
                        </div>
                    )}
                    {error !== "" && (
                        <div className="w-[320px]">
                            <Alert
                                color="danger"
                                description={error}
                                isVisible={error !== ""}
                                title="Error"
                                variant="faded"
                                onClose={() => setError("")}
                            />
                        </div>
                    )}
                </div>
                <div className="flex justify-center gap-4 mb-6">
                    <Button
                        isLoading={isSaving}
                        color="success"
                        variant="flat"
                        radius="full"
                        size="lg"
                        onPress={() => saveWorkout(userId, workout)}
                    >
                        Save Workout
                    </Button>
                    <Button
                        isLoading={isDeleting}
                        color="danger"
                        variant="flat"
                        radius="full"
                        size="lg"
                        onPress={deleteModal.onOpen}
                    >
                        {workout.id === 0 ? "Cancel Workout" : "Delete Workout"}
                    </Button>
                </div>
            </div>

            <WorkoutDetailsModal
                isOpen={detailsModal.isOpen}
                onOpenChange={detailsModal.onOpenChange}
            />

            <SelectExerciseModal
                userId={userId}
                isOpen={addExerciseModal.isOpen}
                onOpenChange={addExerciseModal.onOpenChange}
                callbackFunction={addExercise}
            />

            <DeleteWorkoutModal
                isOpen={deleteModal.isOpen}
                onOpenChange={deleteModal.onOpenChange}
                callbackFunction={() => discardWorkout(userId, workout.id)}
            />
        </WorkoutContext.Provider>
    );
}
