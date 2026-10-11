import {
    useEffect,
    useState,
    useRef,
    createContext,
    useContext,
} from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useRouter } from "next/router";

import Head from "next/head";

import DeleteWorkoutModal from "@/components/workout/DeleteWorkoutModal";
import ExerciseCard from "@/components/workout/ExerciseCard";
import SelectExerciseDrawer from "@/components/workout/SelectExerciseDrawer";
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
    getActiveWorkout,
    addWorkout,
    updateWorkout,
    finishWorkout,
    deleteWorkout,
} from "@/lib/api/workouts";
import { ApiError } from "@/lib/api/apiErrors";
import { formatWorkoutDate } from "@/utils/workoutDate";

import {
    Workout,
    Exercise,
} from "@/types";

import {
    createEmptyWorkout,
    createEmptyWorkoutExercise,
    createEmptySet,
} from "@/lib/factories";

import { useAuth } from "@/components/auth/AuthProvider";

interface WorkoutContextType {
    workout: Workout;
    setWorkout: (updatedWorkout: Workout) => void;
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
    const [startNewWorkout, setStartNewWorkout] = useState(false);
    const [workout, setWorkoutState] = useState<Workout>(createEmptyWorkout());
    const [showSaving, setShowSaving] = useState(false);
    const workoutRef = useRef(workout);
    const isDirtyRef = useRef(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const savingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    // Wrap setWorkout to mark the workout as dirty whenever it is updated.
    const setWorkout = (updatedWorkout: Workout) => {
        isDirtyRef.current = true;
        workoutRef.current = updatedWorkout;
        setWorkoutState(updatedWorkout);
    }

    const { user, isLoading: isAuthLoading } = useAuth();
    const userId = user?.id ?? "";

    const detailsModal = useDisclosure();
    const deleteModal = useDisclosure();
    const addExerciseDrawer = useDisclosure();

    const router = useRouter();
    const queryClient = useQueryClient();

    const { workoutId } = router.query;
    
    const isActiveWorkoutQueryEnabled = !!workoutId && workoutId === "new-workout" && !!user;
    
    // Fetch the active workout if the user is starting a new workout and has an active workout.
    const { data: activeWorkout, isPending: isActiveWorkoutPending } = useQuery({
        queryKey: ["activeWorkout"],
        queryFn: getActiveWorkout,
        enabled: isActiveWorkoutQueryEnabled,
    });
    
    const isActiveWorkoutLoading = isActiveWorkoutQueryEnabled && isActiveWorkoutPending;
    
    const isWorkoutQueryEnabled = !!workoutId && workoutId !== "new-workout" && !!user;
    
    const { data: fetchedWorkout, isPending: isWorkoutPending, error: workoutError } = useQuery({
        queryKey: ["workout", workoutId],
        queryFn: () => getWorkout(workoutId as string),
        enabled: isWorkoutQueryEnabled,
    });

    const isWorkoutLoading = isWorkoutQueryEnabled && isWorkoutPending;

    // getWorkout throws an ApiError with status 403 when the workout belongs to another user.
    const isUnauthorized = workoutError instanceof ApiError && workoutError.status === 403;

    const addWorkoutMutation = useMutation({
        mutationFn: addWorkout,
        onSuccess: (newWorkout) => {
            addToast({
                description: "Workout saved!",
                color: "success",
            });
            // Prime the cache for the new workoutId so navigating to it
            // doesn't trigger a redundant GET.
            queryClient.setQueryData(["workout", newWorkout.id], newWorkout);
            // Append the new workout to the workouts list in the query cache so it appears immediately in the history list without needing to refetch.
            // Sort the workouts by date in descending order so the most recent workout appears first.
            queryClient.setQueryData(["workouts"], (oldWorkouts: Workout[] | undefined) => {
                if (!oldWorkouts) return;
                return [...oldWorkouts, newWorkout].sort((a, b) => {
                    // An in-progress workout should always appear first
                    if (!a.finishedAt && b.finishedAt) return -1;
                    if (a.finishedAt && !b.finishedAt) return 1;
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                });
            });
            // reload the page with the new workoutId
            void router.push(`/workout/${newWorkout.id}`);
        }
    });

    const updateWorkoutMutation = useMutation({
        mutationFn: (workoutData: Workout) => updateWorkout(workoutId, workoutData),
        onSuccess: (updatedWorkout) => {
            setWorkoutState(updatedWorkout);
            // Keep the query cache in sync so a later refetch doesn't briefly serve stale data.
            queryClient.setQueryData(["workout", workoutId], updatedWorkout);
            queryClient.setQueryData(["activeWorkout"], (oldActiveWorkout: Workout | null | undefined) => {
                return oldActiveWorkout?.id === updatedWorkout.id ? updatedWorkout : oldActiveWorkout;
            });
            // Update the workouts list in the query cache so it reflects the updated workout without needing to refetch.
            queryClient.setQueryData(["workouts"], (oldWorkouts: Workout[] | undefined) => {
                if (!oldWorkouts) return;
                return oldWorkouts.map((workout) => workout.id === updatedWorkout.id ? updatedWorkout : workout);
            });
        }
    });

    const saveWorkout = (
        workoutData: Workout
    ): Promise<Workout> => {
        if (workoutId === "new-workout") {
            return addWorkoutMutation.mutateAsync(workoutData);
        } else {
            return updateWorkoutMutation.mutateAsync(workoutData);
        }
    };
    
    // Flush any pending save immediately, without waiting for the autosave delay.
    // This is used when a workout is finished, deleted, or when the user navigates away from the page.
    const flushPendingSave = async () => {
        const hasPendingTimer = saveTimeoutRef.current !== null;
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
        }
        
        if (isDirtyRef.current || hasPendingTimer) {
            isDirtyRef.current = false;
            await saveWorkout(workoutRef.current);
        }
    };
    
    // Use a ref to store the flushPendingSave function so that it can be called from the route change handler 
    // without needing to include it in the dependency array of the useEffect below.
    // Updating it inside an effect (rather than directly in the component body) keeps this
    // assignment out of render, which is what the react-hooks/refs lint rule requires.
    const flushPendingSaveRef = useRef(flushPendingSave);
    useEffect(() => {
        flushPendingSaveRef.current = flushPendingSave;
    });
    
    // Load the workout data when the component mounts or when the workoutId changes. 
    // If the user is starting a new workout and has an active workout, load that instead.
    useEffect(() => {
        if (!router.isReady || isActiveWorkoutLoading || isWorkoutLoading) return;

        if (workoutId === "new-workout") {
            if (activeWorkout) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setWorkoutState(activeWorkout);
                void router.replace(`/workout/${activeWorkout.id}`);
            } else if (startNewWorkout) {
                // The user explicitly chose to start a new workout and has no active
                // workout, so save the new workout immediately with the default title
                // and date.
                // No-op catch because the global error handler will display an error toast if the save fails, 
                // and we don't want to throw an unhandled promise rejection here.
                saveWorkout(workout).catch(() => {});
            }
        } else if (fetchedWorkout) {
            setWorkoutState(fetchedWorkout);
        }
        // `workout`/`saveWorkout`/`router` are intentionally excluded below so this
        // only re-runs when the loaded data itself changes, not on every local edit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        router.isReady,
        workoutId,
        activeWorkout,
        isActiveWorkoutLoading,
        fetchedWorkout,
        isWorkoutLoading,
        startNewWorkout,
    ]);

    const showSavingIndicator = () => {
        setShowSaving(true);
        if (savingIndicatorTimeoutRef.current) {
            clearTimeout(savingIndicatorTimeoutRef.current);
        }
        savingIndicatorTimeoutRef.current = setTimeout(() => {
            setShowSaving(false);
        }, 500);
    };

    const AUTOSAVE_DELAY_MS = 300;
    
    // Autosave the workout after a delay whenever it is updated.
    useEffect(() => {
        // Skip if the workout was changed by the server rather than the user.
        if (!isDirtyRef.current) return;

        // Reset the dirty flag so that if the user makes further changes, they will trigger another autosave.
        isDirtyRef.current = false;

        showSavingIndicator();

        saveTimeoutRef.current = setTimeout(() => {
            // No-op catch because the global error handler will display an error toast if the save fails, 
            // and we don't want to throw an unhandled promise rejection here.
            saveWorkout(workoutRef.current).catch(() => {});
            // Clear the timeout so other code can check whether an autosave is currently pending.
            saveTimeoutRef.current = null;
        }, AUTOSAVE_DELAY_MS);

        // Clear the timeout if the component unmounts or if the workout changes again before the timeout completes.
        return () => clearTimeout(saveTimeoutRef.current ?? undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workout]);
    
    // Flush any pending save when the user navigates away from the page, so that the workout is saved before the user leaves.
    useEffect(() => {
        const handleRouteChangeStart = () => {
            // Force blur the active element so any changes in an input field are committed to the workout state before the save is flushed.
            // Notes, Weight, Reps, and RPE changes only update workout state on blur.
            (document.activeElement as HTMLElement | null)?.blur();
            flushPendingSaveRef.current().catch(() => {});
        };
        
        router.events.on("routeChangeStart", handleRouteChangeStart);
        
        return () => {
            router.events.off("routeChangeStart", handleRouteChangeStart);
        };
    },[router.events]);
    

    const addExercise = (exercise: Exercise) => {
        const updatedWorkout = { ...workout };
        const newWorkoutExercise = createEmptyWorkoutExercise();
        newWorkoutExercise.exerciseId = exercise.id;
        newWorkoutExercise.exercise = exercise;
        newWorkoutExercise.workoutId = workout.id;
        // automatically add an empty set when adding a new exercise
        const newSet = createEmptySet();
        newWorkoutExercise.sets.push(newSet);
        updatedWorkout.exercises.push(newWorkoutExercise);

        setWorkout(updatedWorkout);
    };
    
    const finishWorkoutMutation = useMutation({
        mutationFn: finishWorkout,
        onSuccess: () => {
            addToast({
                description: "Workout finished!",
                color: "success",
            });
            
            // Set the active workout to null in the query cache so that if the user navigates back to the workout page,
            // it will not load the finished workout as the active workout.
            queryClient.setQueryData(["activeWorkout"], null);
            
            void router.push(`/history`);
        },
    });
    
    const completeWorkout = () => {
        void (async () => {
            try {
                // Flush any pending save immediately so that the workout is saved before it is finished.
                await flushPendingSave();

                if (!workout.finishedAt) {
                    await finishWorkoutMutation.mutateAsync(workout.id);
                } else {
                    // If the workout is already finished, just navigate to the history page.
                    // Changes are autosaved, so the user can finish editing and return to history without needing to explicitly save.
                    void router.push(`/history`);
                }
            } catch {
                // No-op catch because the global error handler will display an error toast if the save fails.
            }
        })();
    };
    
    const deleteWorkoutMutation = useMutation({
        mutationFn: deleteWorkout,
        onSuccess: (_data, deletedWorkoutId) => {
            addToast({
                description: `'${workout.title}' was deleted`,
                color: "success",
            });
            // Remove the deleted workout from the workouts list in the query cache so it disappears immediately from the history list without needing to refetch.
            queryClient.setQueryData(["workouts"], (oldWorkouts: Workout[] | undefined) => {
                if (!oldWorkouts) return;
                return oldWorkouts.filter((workout) => workout.id !== deletedWorkoutId);
            });
            setWorkoutState(createEmptyWorkout());
            setStartNewWorkout(false);
            router.push(`/workout/new-workout`).then(() => {
                // Wait until after navigation so this component's useQuery
                // is no longer observing the deleted workout's key - removing
                // it while still observed would trigger an immediate refetch
                // of a workout that no longer exists.
                queryClient.removeQueries({ queryKey: ["workout", deletedWorkoutId] });
            });
        },
    });

    const discardWorkout = async (
        workoutId: string | string[] | undefined
    ) => {
        if (typeof workoutId !== "string") {
            throw new Error("Invalid workoutId.");
        }

        deleteWorkoutMutation.mutate(workoutId);
    };

    if (!router.isReady || isAuthLoading || isWorkoutLoading || isActiveWorkoutLoading) {
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
    // or load an existing workout. If the user has an active workout, it will be loaded automatically.
    if (workoutId === "new-workout" && !startNewWorkout && !activeWorkout) {
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
                                {formatWorkoutDate(workout.date, {
                                    dateStyle: "full",
                                })}
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
                        <Divider className="mb-8"/>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                            {workout.exercises.length > 0 &&
                                workout.exercises.map((exercise, index) => {
                                    return (
                                        <ExerciseCard
                                            key={`exercise-${index}`}
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
                                onPress={addExerciseDrawer.onOpen}
                            >
                                Add Exercise
                            </Button>
                        </div>
                        <div className="flex justify-center gap-4 mb-8">
                            <div>
                                <Button
                                    isLoading={finishWorkoutMutation.isPending}
                                    color="success"
                                    variant="flat"
                                    radius="full"
                                    fullWidth
                                    startContent={
                                        <Icon
                                            icon="material-symbols:check-circle-outline"
                                            width="24"
                                            height="24"
                                        />
                                    }
                                    onPress={completeWorkout}
                                >
                                    {workout.finishedAt ? "Finish Editing" : "Finish Workout"}
                                </Button>
                            </div>
                            <div>
                                <Button
                                    isLoading={deleteWorkoutMutation.isPending}
                                    color="danger"
                                    variant="flat"
                                    radius="full"
                                    fullWidth
                                    startContent={
                                        <DeleteIcon width="20" height="20" />
                                    }
                                    onPress={deleteModal.onOpen}
                                >
                                    Delete Workout
                                </Button>
                            </div>
                        </div>
                        {showSaving && 
                            <div className="flex justify-center">
                                Saving...
                            </div>
                        }
                    </div>
                </main>

                <WorkoutDetailsModal
                    isOpen={detailsModal.isOpen}
                    onOpenChange={detailsModal.onOpenChange}
                />

                {userId && <SelectExerciseDrawer
                    isOpen={addExerciseDrawer.isOpen}
                    onOpenChange={addExerciseDrawer.onOpenChange}
                    callbackFunction={addExercise}
                    update={false}
                />}

                <DeleteWorkoutModal
                    isOpen={deleteModal.isOpen}
                    onOpenChange={deleteModal.onOpenChange}
                    callbackFunction={() => discardWorkout(workoutId)}
                />
            </WorkoutContext.Provider>
        </>
    );
}
