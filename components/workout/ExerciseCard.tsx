import { useContext, useState } from "react";

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
} from "@nextui-org/react";

import { Icon } from "@iconify/react";
import { DeleteIcon } from "@/icons/DeleteIcon";

import SetsTable from "./SetsTable";

import { WorkoutExercise, Set } from "@/utils/models/models";

import { WorkoutContext } from "@/pages/[userId]/workout/[workoutId]";

export default function ExerciseCard({ exercise, exerciseIndex }) {
    const { workout, setWorkout } = useContext(WorkoutContext);

    const [notes, setNotes] = useState(exercise.notes);
    const [weightUnit, setWeightUnit] = useState(exercise.weightUnit);

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

    return (
        <Card classNames={{ footer: "justify-center py-2" }}>
            <CardHeader className="flex justify-between items-center">
                <div className="flex flex-col gap-2">
                    <h3 className="text-md text-primary">
                        {exercise.exercise.name}
                    </h3>
                </div>
                <div className="flex gap-1 items-center">
                    <Popover showArrow offset={10} placement="bottom">
                        <PopoverTrigger>
                            <Button isIconOnly color="default" variant="light" size="sm">
                                <Icon icon="material-symbols:settings" width="16" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px]">
                            {(titleProps) => (
                                <div className="px-1 py-2 w-full">
                                    <p
                                        className="text-small font-bold text-foreground"
                                        {...titleProps}
                                    >
                                        Options
                                    </p>
                                    <div className="mt-2 flex flex-col gap-2 w-full">
                                        <RadioGroup
                                            label="Weight Unit"
                                            id={`${exercise.exercise.name}-weight-unit`}
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
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
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
            <CardBody className="pt-0">
                <Textarea
                    className="mb-4"
                    label="Notes"
                    id={`${exercise.exercise.name}-notes`}
                    minRows={1}
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
            </CardBody>
            <CardFooter>
                <Button color="primary" variant="light" onPress={addSet}>
                    Add Set
                </Button>
            </CardFooter>
        </Card>
    );
}
