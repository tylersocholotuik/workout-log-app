import { useEffect, useState } from "react";

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

import { useWorkoutContext } from "@/pages/workout/[workoutId]";

import { Set, WeightUnit } from "@/utils/models/models";

interface SetsTableProps {
    sets: Set[],
    weightUnit: WeightUnit,
    exerciseIndex: number
};

export default function SetsTable({ sets, weightUnit, exerciseIndex }: SetsTableProps) {
    const { workout, setWorkout } = useWorkoutContext();

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
            // min: 0
            // max: 10
            // must be in steps of 0.5
            isValid =
                parsedValue >= 0 &&
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
            tooltipHeader: "Weight Lifted (lbs/kg)",
            tooltipConent: "Range: 0-9999, steps of 0.5",
        },
        {
            key: "reps",
            label: "Reps",
            tooltipHeader: "Repetitions Performed",
            tooltipConent: "Range: 0-9999",
        },
        {
            key: "rpe",
            label: "RPE",
            tooltipHeader: "Rate of Perceived Exertion",
            tooltipConent: "Range: 0-10, steps of 0.5",
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
                    <TableColumn key={column.key}>
                        <Tooltip
                            content={
                                <div className="px-1 py-2">
                                    <div className="text-small font-bold">
                                        {column.tooltipHeader}
                                    </div>
                                    <div className="text-tiny">
                                        {column.tooltipConent}
                                    </div>
                                </div>
                            }
                            placement="top"
                        >
                            {column.label}
                        </Tooltip>
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody>
                {localSets.map((set, index) => (
                    <TableRow key={`exercise-${exerciseIndex}-set-${index}`}>
                        <TableCell>
                            <Input
                                classNames={{input: 'text-center'}}
                                id={`exercise-${exerciseIndex}-set-${index}-weight`}
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
                                value={`${localSets[index].weight}` || ""}
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
                                classNames={{input: 'text-center'}}
                                id={`exercise-${exerciseIndex}-set-${index}-reps`}
                                type="number"
                                variant="bordered"
                                size="sm"
                                aria-label="reps"
                                color="primary"
                                min="0"
                                max="9999"
                                step="1"
                                value={`${localSets[index].reps}` || ""}
                                onValueChange={(newValue) => {
                                    handleInputChange(index, "reps", newValue);
                                }}
                                onBlur={saveChanges}
                            />
                        </TableCell>
                        <TableCell>
                            <Input
                                classNames={{input: 'text-center'}}
                                id={`exercise-${exerciseIndex}-set-${index}-rpe`}
                                type="number"
                                variant="bordered"
                                size="sm"
                                aria-label="rpe"
                                color="primary"
                                min="0"
                                max="10"
                                step="0.5"
                                value={`${localSets[index].rpe}` || ""}
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
