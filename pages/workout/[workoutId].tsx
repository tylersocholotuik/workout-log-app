import {
    useEffect,
    useState,
    createContext,
    useContext,
    Dispatch,
    SetStateAction,
} from "react";

import { useRouter } from "next/router";

import Head from "next/head";

import CalculatorModal from "@/components/workout/CalculatorModal";
import DeleteWorkoutModal from "@/components/workout/DeleteWorkoutModal";
import ExerciseCard from "@/components/workout/ExerciseCard";
import SelectExerciseModal from "@/components/workout/SelectExerciseModal";
import WorkoutDetailsModal from "@/components/workout/WorkoutDetailsModal";

import {
    Button,
    Spinner,
    useDisclosure,
    Divider,
    Link,
    addToast,
} from "@heroui/react";

import { Icon } from "@iconify/react/dist/iconify.js";
import { EditIcon } from "@/icons/EditIcon";
import { DeleteIcon } from "@/icons/DeleteIcon";

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
} from "@/utils/models/models";

import { useAuth } from "@/components/auth/AuthProvider";

interface WorkoutContextType {
    workout: Workout;
    setWorkout: Dispatch<SetStateAction<Workout>>;
}

export const WorkoutContext = createContext<WorkoutContextType | undefined>(
    undefined
);

export const useWorkoutContext = () => {
    const context = useContext(WorkoutContext);
    if (!context) {
        throw new Error(
            "useWorkoutContext must be used within a WorkoutProvider"
        );
    }
    return context;
};

export default function WorkoutLog() {
    const [workout, setWorkout] = useState<Workout>(new Workout());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [startNewWorkout, setStartNewWorkout] = useState(false);
    const [userId, setUserId] = useState("");
    const [isUnauthorized, setIsUnauthorized] = useState(false);

    const { user } = useAuth();

    const detailsModal = useDisclosure();
    const deleteModal = useDisclosure();
    const addExerciseModal = useDisclosure();
    const calculatorModal = useDisclosure();

    const router = useRouter();

    const { workoutId } = router.query;

    useEffect(() => {
        if (router.isReady && workoutId && user) {
            setUserId(user.id);
            loadWorkout(user.id, workoutId);
        }
    }, [router.isReady, workoutId, user]);

    const loadWorkout = async (
        userId: string | string[] | undefined,
        workoutId: string | string[]
    ) => {
        // id is greater than 0 if navigating from workout history page
        // load the selected workout. Otherwise, it's a new workout.
        if (user && workoutId !== "new-workout") {
            try {
                const data = await getWorkout(userId, workoutId);
                // ensuring the logged in user id matches the userId
                // of the workout
                if (data?.userId !== user.id) {
                    setIsUnauthorized(true);
                }
                setWorkout(data);
            } catch (error) {
                addToast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                    color: "danger",
                });
            }
        }

        setIsLoading(false);
    };

    const addExercise = (exercise: Exercise) => {
        const updatedWorkout = { ...workout };
        const newWorkoutExercise = new WorkoutExercise();
        // if userId is present, that means it is a user exercise
        if ("userId" in exercise) {
            newWorkoutExercise.userExerciseId = exercise.id;
        }
        newWorkoutExercise.exerciseId = exercise.id;
        newWorkoutExercise.exercise = exercise;
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
            setIsSaving(true);

            let newWorkout: Workout;

            if (workoutId === "new-workout") {
                newWorkout = await addWorkout(userId, workoutData);
                // reload the page with the new workoutId
                await router.push(`/workout/${newWorkout.id}`);
            } else {
                newWorkout = await updateWorkout(userId, workoutData);
                setWorkout(newWorkout);
            }

            addToast({
                description: "Workout saved!",
                color: "success",
            });
        } catch (error) {
            addToast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                    color: "danger",
                });
        } finally {
            setIsSaving(false);
        }
    };

    const discardWorkout = async (
        userId: string | string[] | undefined,
        workoutId: string | string[] | undefined
    ) => {
        if (typeof workoutId !== "string") {
            throw new Error("Invalid workoutId.");
        }

        let success = false;

        if (workoutId === "new-workout") {
            // if it is a new unsaved workout, simply initialize a
            // new workout
            setWorkout(new Workout());
            setStartNewWorkout(false);
        } else {
            try {
                setIsDeleting(true);

                await deleteWorkout(userId, workoutId);

                addToast({
                    description: `'${workout.title}' was deleted`,
                    color: "success",
                });

                success = true;
            } catch (error) {
                addToast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "An unknown error occurred",
                    color: "danger",
                });
            } finally {
                setIsDeleting(false);
                if (success) {
                    setWorkout(new Workout());
                    setStartNewWorkout(false);
                    router.push(`/workout/new-workout`);
                }
            }
        }
    };

    if (isLoading) {
        return (
            <>
                <Head>
                    <title>Workout</title>
                </Head>
                <main>
                    <div className="absolute top-1/2 left-2/4 -translate-x-1/2 -translate-y-1/2">
                        <Spinner size="lg" />
                    </div>
                </main>
            </>
        );
    }

    // This will appear if the logged in user's id does not match the userId of the loaded workout.
    // Workout id's can be typed into the url, so this prevents users from viewing someone else's
    // workout.
    if (isUnauthorized) {
        return (
            <>
                <Head>
                    <title>Workout</title>
                </Head>
                <main>
                    <div className="absolute top-1/2 left-2/4 -translate-x-1/2 -translate-y-1/2 w-full p-4">
                        <div className="flex flex-col min-[370px]:items-center gap-4">
                            <p className="text-xl lg:text-3xl">
                                Oops! This is someone else&apos;s workout!
                            </p>
                            <Link size="lg" href="/">
                                Return to home page
                            </Link>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    // if navigating directly to workout page, prompt user to either start a new workout
    // or load an existing workout
    if (workoutId === "new-workout" && !startNewWorkout) {
        return (
            <>
                <Head>
                    <title>Workout</title>
                </Head>
                <main>
                    <div className="container mx-auto px-2 md:px-4 py-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6 absolute top-1/2 left-2/4 -translate-x-1/2 -translate-y-1/2">
                            <div>
                                <Button
                                    color="primary"
                                    size="lg"
                                    variant="solid"
                                    radius="full"
                                    onPress={() => setStartNewWorkout(true)}
                                    startContent={
                                        <Icon
                                            icon="gridicons:create"
                                            width="24"
                                            height="24"
                                        />
                                    }
                                >
                                    Create New Workout
                                </Button>
                            </div>
                            <div>
                                <Button
                                    color="secondary"
                                    size="lg"
                                    variant="solid"
                                    radius="full"
                                    onPress={() => router.push(`/history`)}
                                    startContent={
                                        <Icon
                                            icon="material-symbols:history"
                                            width="24"
                                            height="24"
                                        />
                                    }
                                >
                                    Load Existing Workout
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Workout</title>
                <meta
                    property="description"
                    content="Log your workout by selecting from a list of pre-loaded exercises or creating your own, and enter the weight, reps, and RPE for each set you performed."
                />
            </Head>
            <WorkoutContext.Provider value={{ workout, setWorkout }}>
                <main>
                    <div className="container mx-auto px-2 md:px-4 py-6">
                        <div className="flex flex-col gap-2 items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                {workout.title}
                            </h2>
                            <p className="text-md">
                                {new Date(workout.date).toLocaleString(
                                    "en-CA",
                                    {
                                        dateStyle: "full",
                                    }
                                )}
                            </p>
                            <div className="max-w-[400px] text-center">
                                {workout.notes && (
                                    <p className="text-md text-default-500">
                                        <span className="font-bold">
                                            Notes:{" "}
                                        </span>
                                        {workout.notes}
                                    </p>
                                )}
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
                        <Divider />
                        <div className="flex justify-center my-8">
                            <Button
                                aria-label="one-rep max calculator"
                                color="primary"
                                variant="light"
                                radius="full"
                                onPress={calculatorModal.onOpen}
                                startContent={
                                    <Icon
                                        icon="mdi:calculator"
                                        width="24"
                                        height="24"
                                    />
                                }
                            >
                                1RM Calculator
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                            {workout.exercises.length > 0 &&
                                workout.exercises.map((exercise, index) => {
                                    return (
                                        <ExerciseCard
                                            key={`exercise-${index}`}
                                            exercise={exercise}
                                            exerciseIndex={index}
                                            userId={userId}
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
                        <div className="flex justify-center gap-4 mb-8">
                            <div>
                                <Button
                                    isLoading={isSaving}
                                    color="default"
                                    variant="flat"
                                    radius="full"
                                    fullWidth
                                    startContent={
                                        <Icon
                                            icon="material-symbols:save-outline"
                                            width="24"
                                            height="24"
                                        />
                                    }
                                    onPress={() => saveWorkout(userId, workout)}
                                >
                                    Save Workout
                                </Button>
                            </div>
                            <div>
                                <Button
                                    isLoading={isDeleting}
                                    color="danger"
                                    variant="flat"
                                    radius="full"
                                    fullWidth
                                    startContent={
                                        <DeleteIcon width="20" height="20" />
                                    }
                                    onPress={deleteModal.onOpen}
                                >
                                    {workout.id === "" ||
                                    workout.id === "new-workout"
                                        ? "Cancel Workout"
                                        : "Delete Workout"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </main>

                <WorkoutDetailsModal
                    isOpen={detailsModal.isOpen}
                    onOpenChange={detailsModal.onOpenChange}
                />

                {userId && <SelectExerciseModal
                    userId={userId}
                    isOpen={addExerciseModal.isOpen}
                    onOpenChange={addExerciseModal.onOpenChange}
                    callbackFunction={addExercise}
                    update={false}
                />}

                <DeleteWorkoutModal
                    isOpen={deleteModal.isOpen}
                    onOpenChange={deleteModal.onOpenChange}
                    callbackFunction={() => discardWorkout(userId, workoutId)}
                />

                <CalculatorModal
                    isOpen={calculatorModal.isOpen}
                    onOpenChange={calculatorModal.onOpenChange}
                />
            </WorkoutContext.Provider>
        </>
    );
}
