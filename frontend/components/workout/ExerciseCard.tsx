import { useState, useEffect } from "react";

import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Divider,
    Textarea,
    RadioGroup,
    Radio,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Tooltip,
    Switch,
    useDisclosure,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/react";

import { Icon } from "@iconify/react";
import { DeleteIcon } from "@/icons/DeleteIcon";

import SetsTable from "./SetsTable";

import {
    Exercise,
    WorkoutExercise,
    Set,
    ExerciseHistory,
} from "@/utils/models/models";

import SelectExerciseModal from "./SelectExerciseModal";
import ExerciseHistoryModal from "./ExerciseHistoryModal";

import { useWorkoutContext } from "@/pages/workout/[workoutId]";

import { calculateOneRepMax } from "@/utils/calculator/calc-functions";

import { getExerciseHistory } from "@/utils/api/exercises";

interface ExerciseCardProps {
    exercise: WorkoutExercise;
    exerciseIndex: number;
    userId: string;
}

import { supabase } from "@/utils/supabase/supabaseClient";

export default function ExerciseCard({
    exercise,
    exerciseIndex,
}: ExerciseCardProps) {
    const { workout, setWorkout } = useWorkoutContext();

    const [notes, setNotes] = useState(exercise.notes);
    const [weightUnit, setWeightUnit] = useState(exercise.weightUnit.toString());
    const [oneRepMax, setOneRepMax] = useState<number | null>();
    const [showOneRepMax, setShowOneRepMax] = useState(true);
    const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistory[]>(
        []
    );
    const [userId, setUserId] = useState("");

    const changeExerciseModal = useDisclosure();
    const exerciseHistoryModal = useDisclosure();

    useEffect(() => {
        getUserId();
    }, []);

    useEffect(() => {
        updateOneRepMax(exercise.sets);
    }, [workout]);

    const getUserId = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            setUserId(user.id);
        }
    };

    const addSet = () => {
        const newSet = new Set();

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

    const changeExercise = (
        newExercise: Exercise,
        exerciseIndex?: number
    ) => {
        // create deep copy of workout
        let updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise) => ({
                ...exercise,
                sets: exercise.sets.map((set) => ({
                    ...set,
                })),
            })),
        };

        // checking if the new exercise is a stock exercise, and the previous was a
        // user exercise. If so, set user exercise to null and map new exercise
        // properties to exercise
        if (
            !("userId" in newExercise) &&
            "userExerciseId" in updatedWorkout.exercises[exerciseIndex!]
        ) {
            updatedWorkout = {
                ...workout,
                exercises: workout.exercises.map((exercise, index) =>
                    index === exerciseIndex
                        ? {
                              ...exercise,
                              exercise: {
                                  id: newExercise.id,
                                  name: newExercise.name,
                              },
                              userExercise: null,
                              exerciseId: newExercise.id,
                              userExerciseId: null,
                              sets: exercise.sets.map((set) => ({
                                  ...set,
                              })),
                          }
                        : exercise
                ),
            };
        } else {
            updatedWorkout = {
                ...workout,
                exercises: workout.exercises.map((exercise, index) =>
                    index === exerciseIndex
                        ? {
                              ...exercise,
                              exercise: {
                                  id: newExercise.id,
                                  name: newExercise.name,
                                  userId: workout.userId,
                                  deleted: false,
                              },
                              exerciseId: null,
                              userExerciseId: newExercise.id,
                              sets: exercise.sets.map((set) => ({
                                  ...set,
                              })),
                          }
                        : exercise
                ),
            };
        }

        setWorkout(updatedWorkout);
    };

    const saveInputChange = (
        exerciseIndex: number,
        field: string,
        value: string
    ) => {
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                          ...exercise,
                          [field]: value,
                      }
                    : exercise
            ),
        };

        setWorkout(updatedWorkout);
    };

    const updateOneRepMax = (sets: Set[]) => {
        // determine best set that has between 1-10 reps and RPE >= 6
        // this rule is due to there only being data for these values
        // see utils/calc-functions/rpeData.ts
        const eligibleSets = sets.filter((set) => {
            if (set.weight && set.reps && set.rpe) {
                return set.reps >= 1 && set.reps <= 10 && set.rpe >= 6;
            }
        });

        if (eligibleSets.length > 0) {
            // calculate e1RM for each set and use the highest value
            const maxList = eligibleSets.map((set) => {
                return calculateOneRepMax(set.weight!, set.reps!, set.rpe!);
            });

            const highestOneRepMax = Math.max(...maxList);

            setOneRepMax(highestOneRepMax);
        } else {
            setOneRepMax(null);
        }
    };

    // gets a list including the date, notes, and sets for the selected exercise
    // for each time the user performed that exercise.
    const fetchExerciseHistory = async (
        userId: string | string | undefined,
        exerciseId?: number | null | undefined,
        userExerciseId?: number | null | undefined
    ) => {
        const data = await getExerciseHistory(
            userId,
            exerciseId,
            userExerciseId
        );

        setExerciseHistory(data);

        exerciseHistoryModal.onOpen();
    };

    return (
        <>
            <Card classNames={{ footer: "justify-center py-2" }}>
                <CardHeader className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        <h3 className="text-md text-primary">
                            {exercise.exercise?.name}
                        </h3>
                        <div>
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        aria-label="Actions"
                                        variant="light"
                                        size="sm"
                                        isIconOnly
                                    >
                                        <Tooltip content="Actions" offset={12}>
                                            <Icon
                                                icon="tabler:dots"
                                                width="16"
                                                height="16"
                                            />
                                        </Tooltip>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Static Actions">
                                    <DropdownItem
                                        key="change"
                                        onPress={changeExerciseModal.onOpen}
                                        startContent={
                                            <Icon
                                                icon="material-symbols:change-circle-rounded"
                                                width="18"
                                                height="18"
                                            />
                                        }
                                    >
                                        Change exercise
                                    </DropdownItem>
                                    <DropdownItem
                                        key="history"
                                        onPress={() =>
                                            fetchExerciseHistory(
                                                userId,
                                                exercise.exercise?.id,
                                                exercise.userExerciseId
                                            )
                                        }
                                        startContent={
                                            <Icon
                                                icon="material-symbols:history"
                                                width="18"
                                                height="18"
                                            />
                                        }
                                    >
                                        Exercise history
                                    </DropdownItem>
                                    <DropdownItem
                                        key="delete"
                                        color="danger"
                                        className="text-danger"
                                        onPress={deleteExercise}
                                        startContent={<DeleteIcon />}
                                    >
                                        Delete exercise
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        </div>
                    </div>
                    <div className="flex gap-1 items-center">
                        <Popover showArrow offset={10} placement="left-start">
                            <PopoverTrigger>
                                <Button
                                    aria-label="exercise options"
                                    isIconOnly
                                    color="default"
                                    variant="light"
                                    size="sm"
                                >
                                    <Tooltip content="Options">
                                        <Icon
                                            icon="material-symbols:settings"
                                            width="16"
                                        />
                                    </Tooltip>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[240px]">
                                {(titleProps) => (
                                    <div className="px-1 py-2 w-full">
                                        <p
                                            className="text-small font-bold text-foreground mb-2"
                                            {...titleProps}
                                        >
                                            Options
                                        </p>
                                        <div className="flex flex-col gap-2 w-full mb-4">
                                            <RadioGroup
                                                label="Weight Unit"
                                                id={`exercise-${exerciseIndex}-weight-unit`}
                                                orientation="horizontal"
                                                value={weightUnit}
                                                onValueChange={(newValue) => {
                                                    setWeightUnit(newValue);
                                                    saveInputChange(
                                                        exerciseIndex,
                                                        "weightUnit",
                                                        newValue
                                                    );
                                                }}
                                            >
                                                <Radio value="lbs">lbs</Radio>
                                                <Radio value="kg">kg</Radio>
                                            </RadioGroup>
                                        </div>
                                        <div>
                                            <Switch
                                                size="sm"
                                                isSelected={showOneRepMax}
                                                onValueChange={setShowOneRepMax}
                                            >
                                                Show e1RM
                                            </Switch>
                                        </div>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <Divider />
                <CardBody className="pt-0">
                    <Textarea
                        className="mb-4"
                        label="Notes"
                        id={`exercise-${exerciseIndex}-notes`}
                        minRows={1}
                        maxRows={3}
                        maxLength={100}
                        variant="underlined"
                        value={notes}
                        onValueChange={setNotes}
                        onBlur={() =>
                            saveInputChange(exerciseIndex, "notes", notes)
                        }
                    />
                    <SetsTable
                        sets={exercise.sets}
                        weightUnit={exercise.weightUnit}
                        exerciseIndex={exerciseIndex}
                    />
                    {oneRepMax && showOneRepMax && (
                        <div className="flex justify-center mt-4">
                            <Tooltip
                                content="Estimated one-rep max"
                                placement="bottom"
                            >
                                <p className="text-default-500 text-sm">
                                    e1RM:{" "}
                                    <span className="text-default-800 dark:text-white">
                                        {oneRepMax} {exercise.weightUnit}
                                    </span>
                                </p>
                            </Tooltip>
                        </div>
                    )}
                </CardBody>
                <CardFooter>
                    <Button color="primary" variant="light" onPress={addSet}>
                        Add Set
                    </Button>
                </CardFooter>
            </Card>

            <SelectExerciseModal
                userId={userId}
                isOpen={changeExerciseModal.isOpen}
                onOpenChange={changeExerciseModal.onOpenChange}
                callbackFunction={changeExercise}
                exerciseIndex={exerciseIndex}
                update={true}
            />

            <ExerciseHistoryModal
                isOpen={exerciseHistoryModal.isOpen}
                onOpenChange={exerciseHistoryModal.onOpenChange}
                exerciseHistory={exerciseHistory}
                exerciseName={
                    exercise.exercise?.name ?? ""
                }
            />
        </>
    );
}
