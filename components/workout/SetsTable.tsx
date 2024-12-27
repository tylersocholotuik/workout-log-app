import { useContext, useEffect, useState } from "react";

import {
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Tooltip,
} from "@nextui-org/react";

import { DeleteIcon } from "@/icons/DeleteIcon";

import { WorkoutContext } from "@/pages/[userId]/workout/[workoutId]";

export default function SetsTable({ sets, weightUnit, exerciseIndex }) {
    const { workout, setWorkout } = useContext(WorkoutContext);

    const [localSets, setLocalSets] = useState(sets);

    useEffect(() => {
        setLocalSets(sets);
    }, [sets]);

    // this method updates the state for localSets, and prevents user
    // from entering bad data
    const handleInputChange = (
        setIndex: number,
        field: string,
        value: string
    ) => {
        // allow empty or null values
        if (value === "" || value === null) {
            setLocalSets((prevSets) =>
                prevSets.map((set, index) =>
                    index === setIndex ? { ...set, [field]: null } : set
                )
            );
            return;
        }

        const parsedValue = parseFloat(value);

        let isValid = false;
        // rules for weight:
        // min: 0
        // max: 9999
        // must be in steps of 0.5
        if (field === "weight") {
            isValid =
                parsedValue >= 0 &&
                parsedValue <= 9999 &&
                parsedValue % 0.5 === 0;
        } else if (field === "reps") {
            // rules for reps:
            // min: 0 
            // max: 9999
            // must be whole number
            isValid =
                parsedValue >= 0 &&
                parsedValue <= 9999 &&
                Number.isInteger(parsedValue);
        } else if (field === "rpe") {
            // rules for rpe
            // min: 6 (people are not accurate at rating RPE below 6)
            // max: 10
            // must be in steps of 0.5
            isValid =
                parsedValue >= 6 &&
                parsedValue <= 10 &&
                parsedValue % 0.5 === 0;
        }

        // allow input if isValid, otherwise, input is prevented
        if (isValid) {
            setLocalSets((prevSets) =>
                prevSets.map((set, index) =>
                    index === setIndex ? { ...set, [field]: parsedValue } : set
                )
            );
        }
    };

    const saveChanges = () => {
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                          ...exercise,
                          sets: localSets,
                      }
                    : exercise
            ),
        };

        setWorkout(updatedWorkout);
    };

    const deleteSet = (setIndex: number) => {
        const updatedSets = localSets.filter((_, index) => index !== setIndex);
        setLocalSets(updatedSets);

        // Update the global workout context after deleting a set
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                          ...exercise,
                          sets: updatedSets,
                      }
                    : exercise
            ),
        };

        setWorkout(updatedWorkout);
    };

    const columns = [
        {
            key: "weight",
            label: "Weight",
        },
        {
            key: "reps",
            label: "Reps",
        },
        {
            key: "rpe",
            label: "RPE",
        },
        {
            key: "delete",
            label: "",
        },
    ];

    return (
        <Table
            aria-label="Sets table"
            removeWrapper
            isCompact
            classNames={{ th: "text-center" }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
            </TableHeader>
            <TableBody>
                {localSets.map((set, index) => (
                    <TableRow key={`set-${index}`}>
                        <TableCell>
                            <Input
                                id={`set-${index}-weight`}
                                type="number"
                                variant="bordered"
                                size="sm"
                                aria-label="weight"
                                color="primary"
                                min="0"
                                max="9999"
                                step="0.5"
                                endContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">
                                            {weightUnit}
                                        </span>
                                    </div>
                                }
                                value={localSets[index]?.weight ?? ""}
                                onValueChange={(newValue) => {
                                    handleInputChange(
                                        index,
                                        "weight",
                                        newValue
                                    );
                                }}
                                onBlur={saveChanges}
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                                id={`set-${index}-reps`}
                                type="number"
                                variant="bordered"
                                size="sm"
                                aria-label="reps"
                                color="primary"
                                min="0"
                                max="9999"
                                step="1"
                                value={localSets[index]?.reps ?? ""}
                                onValueChange={(newValue) => {
                                    handleInputChange(index, "reps", newValue);
                                }}
                                onBlur={saveChanges}
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                                id={`set-${index}-rpe`}
                                type="number"
                                variant="bordered"
                                size="sm"
                                aria-label="rpe"
                                color="primary"
                                min="6"
                                max="10"
                                step="0.5"
                                value={localSets[index]?.rpe ?? ""}
                                onValueChange={(newValue) => {
                                    handleInputChange(index, "rpe", newValue);
                                }}
                                onBlur={saveChanges}
                            />
                        </TableCell>
                        <TableCell>
                            <Tooltip content="Delete Set">
                                <Button
                                    isIconOnly
                                    aria-label="delete set"
                                    color="danger"
                                    variant="light"
                                    onPress={() => deleteSet(index)}
                                >
                                    <DeleteIcon />
                                </Button>
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
