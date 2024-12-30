import { useContext, useState, useEffect } from "react";

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
} from "@nextui-org/react";

import { Icon } from "@iconify/react";
import { DeleteIcon } from "@/icons/DeleteIcon";

import SetsTable from "./SetsTable";

import { Set } from "@/utils/models/models";

import { WorkoutContext } from "@/pages/[userId]/workout/[workoutId]";

import { calculateOneRepMax } from "@/utils/calculator/calc-functions";

export default function ExerciseCard({ exercise, exerciseIndex }) {
    const { workout, setWorkout } = useContext(WorkoutContext);

    const [notes, setNotes] = useState(exercise.notes);
    const [weightUnit, setWeightUnit] = useState(exercise.weightUnit);
    const [oneRepMax, setOneRepMax] = useState<number | null>();
    const [showOneRepMax, setShowOneRepMax] = useState(true);

    useEffect(() => {
        updateOneRepMax(exercise.sets);
    }, [workout]);

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
        const elligibleSets = sets.filter((set) => {
            if (set.weight && set.reps && set.rpe) {
                return set.reps >= 1 && set.reps <= 10 && set.rpe >= 6;
            }
        });

        if (elligibleSets.length > 0) {
            // calculate e1RM for each set and use the highest value
            const maxList = elligibleSets.map((set) => {
                return calculateOneRepMax(set.weight, set.reps, set.rpe);
            });

            const highestOneRepMax = Math.max(...maxList);

            setOneRepMax(highestOneRepMax);
        }
    };

    return (
        <Card classNames={{ footer: "justify-center py-2" }}>
            <CardHeader className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    {exercise.exercise && (
                        <h3 className="text-md text-primary">
                            {exercise.exercise.name}
                        </h3>
                    )}
                    {exercise.userExercise && (
                        <h3 className="text-md text-primary">
                            {exercise.userExercise.name}
                        </h3>
                    )}
                </div>
                <div className="flex gap-1 items-center">
                    <Popover showArrow offset={10} placement="bottom">
                        <PopoverTrigger>
                            <Button
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
                                    <div className="flex flex-col gap-2 w-full mb-2">
                                        <RadioGroup
                                            label="Weight Unit"
                                            id={`exercise-${exerciseIndex}-weight-unit`}
                                            orientation="vertical"
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
                    <Tooltip content="Delete Exercise">
                        <Button
                            isIconOnly
                            aria-label="delete set"
                            color="danger"
                            variant="light"
                            onPress={deleteExercise}
                        >
                            <DeleteIcon />
                        </Button>
                    </Tooltip>
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
                            <p className="text-default-500">
                                e1RM:{" "}
                                <span className="text-white">
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
    );
}
