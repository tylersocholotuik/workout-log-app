import {
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
} from "@nextui-org/react";

import { DeleteIcon } from "@/icons/DeleteIcon";

export default function SetsTable({
    sets,
    weightUnit,
    exerciseIndex,
    workout,
    setWorkout,
}) {
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

    // updates the workout with the changes to the weight, reps, or rpe
    // values of a given set
    const handleInputChange = (
        setIndex: number,
        field: string,
        value: string
    ) => {
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                          ...exercise,
                          sets: exercise.sets.map((set, i) =>
                              i === setIndex
                                  ? {
                                        ...set,
                                        [field]: Number(value),
                                    }
                                  : set
                          ),
                      }
                    : exercise
            ),
        };

        setWorkout(updatedWorkout);
    };

    const deleteSet = (setIndex: number) => {
        // creating a deep copy of workout, then removing the set at the
        // index of where the delete button was pressed
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                          ...exercise,
                          sets: exercise.sets.filter((_, i) => i !== setIndex),
                      }
                    : exercise
            ),
        };
        setWorkout(updatedWorkout);
    };

    return (
        <Table
            aria-label="Sets table"
            removeWrapper
            classNames={{ th: "text-center" }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                )}
            </TableHeader>
            <TableBody>
                {sets.map((set, index) => (
                    <TableRow key={set.tempId || `set-${index}`}>
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
                                value={set.weight ?? ""}
                                onValueChange={(newValue) => {
                                    handleInputChange(
                                        index,
                                        "weight",
                                        newValue
                                    );
                                }}
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
                                value={set.reps ?? ""}
                                onValueChange={(newValue) => {
                                    handleInputChange(index, "reps", newValue);
                                }}
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
                                value={set.rpe ?? ""}
                                onValueChange={(newValue) => {
                                    handleInputChange(index, "rpe", newValue);
                                }}
                            />
                        </TableCell>
                        <TableCell>
                            <Button
                                isIconOnly
                                aria-label="delete set"
                                color="danger"
                                variant="light"
                                onPress={() => deleteSet(index)}
                            >
                                <DeleteIcon />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
