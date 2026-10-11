import { useState, useMemo } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useMediaQuery } from "react-responsive";

import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Selection,
    Input,
    Form,
    addToast,
    Spinner,
} from "@heroui/react";

import { SearchIcon } from "@/icons/SearchIcon";

import { Exercise } from "@/types";
import {
    getExercises,
    addUserExercise,
} from "@/lib/api/exercises";

interface SelectExerciseModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    callbackFunction: (newExercise: Exercise, exerciseIndex?: number) => void;
    exerciseIndex?: number;
    update: boolean;
}

export default function SelectExerciseModal({
                                                isOpen,
                                                onOpenChange,
                                                callbackFunction,
                                                exerciseIndex,
                                                update,
                                            }: SelectExerciseModalProps) {
    const [selectedKey, setSelectedKey] = useState<Selection>(new Set());
    const [filterValue, setFilterValue] = useState("");
    const [exerciseName, setExerciseName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");
    
    const isMobile = useMediaQuery({ maxWidth: 1024 });

    const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({ queryKey: ["exercises"], queryFn: getExercises });
    
    // Return exercises that contain any of the words in the filterValue, regardless of order
    const filteredExercises = useMemo(
        () => {
            const splitString = (value: string) => 
                value.split(" ").filter((part) => part.trim() !== "");
            
            const filterValueParts = splitString(filterValue);
            
            let filteredExercises = exercises;
            
            if (filterValue) {
                filteredExercises = exercises.filter((exercise: Exercise) => {
                    const exerciseParts = splitString(exercise.name);
                    
                    // Check if every part of the filterValue is included in any part of the exercise name
                    // e.g filterValue "inc bench" will match "Bench Press (Incline)"
                    return filterValueParts.every((filterPart) =>
                        exerciseParts.some((exercisePart) =>
                            exercisePart.toLowerCase().includes(filterPart.toLowerCase())
                        )
                    );
                });
            }
            
            return filteredExercises;
        },
        [exercises, filterValue]
    );

    // gets the selected exercise id, and returns the exercise that matches the id
    const getSelectedExercise = () => {
        const selectedExercise = Array.from(selectedKey).pop();

        return selectedExercise
            ? exercises.find((exercise: Exercise) => exercise.name === selectedExercise)
            : null;
    };

    const queryClient = useQueryClient();

    const newExerciseMutation = useMutation({
        mutationFn: addUserExercise,
        // This mutation already shows its own inline field error on failure -
        // skip the global error toast to avoid showing the same message twice.
        meta: { skipGlobalErrorToast: true },
        onSuccess: (newExercise) => {
            // Append new exercise to the existing exercises in the query cache
            // instead of refetching the entire list of exercises
            queryClient.setQueryData(["exercises"], (oldExercises: Exercise[] = []) => [
                ...oldExercises,
                newExercise,
            ].sort((a, b) => a.name.localeCompare(b.name)));

            addToast({
                description: `Exercise '${newExercise.name}' was created!`,
                color: "success",
                timeout: 5000,
                endContent: (
                    <Button
                        color="success"
                        size="sm"
                        variant="flat"
                        onPress={() => {
                            addCreatedExerciseToWorkout(newExercise);
                            setIsCreating(false);
                            onOpenChange();
                        }}
                    >
                        Add
                    </Button>
                ),
            });

        },
        onError: (error) => {
            setError(error instanceof Error ? error.message : "An unknown error occurred");
        }
    });

    const createNewExercise = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setError("");

        if (exerciseName.trim() === "") {
            setError("Please enter an exercise name.");
            return;
        }

        newExerciseMutation.mutate(exerciseName.trim());

        setExerciseName("");
    };

    const clearState = () => {
        setSelectedKey(new Set());
        setFilterValue("");
        setError("");
        setExerciseName("");
        setIsCreating(false);
    };
    
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            clearState();
        }
        onOpenChange();
    }

    const onAdd = () => {
        const selectedExercise = getSelectedExercise();

        if (selectedExercise) {
            if (!update) {
                // callbackFunction = addExercise
                callbackFunction(selectedExercise);
            } else {
                // callbackFunction = changeExercise
                callbackFunction(selectedExercise, exerciseIndex);
            }
            clearState();
        }
    };

    const addCreatedExerciseToWorkout = (exercise: Exercise) => {
        // return early if there is no new exercise loaded
        // (default id value for new Exercise is 0)
        if (!exercise || exercise.id === 0) {
            return;
        }

        // add new exercise to workout
        if (!update) {
            callbackFunction(exercise);
        } else {
            callbackFunction(exercise, exerciseIndex);
        }
        clearState();
    };

    const columns = [
        {
            key: "exercise",
            label: "Exercise",
        },
    ];

    return (
        <Drawer
            isOpen={isOpen}
            isKeyboardDismissDisabled
            scrollBehavior="inside"
            placement={isMobile ? "top" : "right"}
            size="md"
            onOpenChange={handleOpenChange}
        >
            <DrawerContent>
                {(onClose) => (
                    <>
                        <DrawerHeader className="flex flex-col items-center gap-1">
                            <h2 className="text-sm md:text-lg">
                                Select Exercise
                            </h2>
                            {!isCreating && 
                                <div className="w-full mt-4">
                                    <Input
                                        className="w-full"
                                        placeholder="Search exercises..."
                                        size={isMobile ? "sm" : "md"}
                                        startContent={<SearchIcon/>}
                                        value={filterValue}
                                        onClear={() => setFilterValue("")}
                                        onValueChange={setFilterValue}
                                    />
                                </div>}
                        </DrawerHeader>
                        <DrawerBody>
                            {isCreating ? (
                                <div className="">
                                    <h3 className="text-sm md:text-md text-center mb-4">
                                        Create new exercise
                                    </h3>
                                    <Form
                                        id="create-exercise-form"
                                        onSubmit={createNewExercise}
                                        className="mb-4"
                                        validationBehavior="aria"
                                    >
                                        <Input
                                            isRequired
                                            id="exercise-name"
                                            name="exerciseName"
                                            label="Exercise Name"
                                            variant="bordered"
                                            size="sm"
                                            description="Can not have the same name as a stock exercise."
                                            validate={() => error || undefined}
                                            value={exerciseName}
                                            onValueChange={setExerciseName}
                                            onChange={() => setError("")}
                                        />
                                    </Form>
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            variant="flat"
                                            size="sm"
                                            onPress={() => {
                                                setIsCreating(false);
                                                setExerciseName("");
                                                setError("");
                                            }}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            color="primary"
                                            size="sm"
                                            type="submit"
                                            form="create-exercise-form"
                                            isLoading={newExerciseMutation.isPending}
                                        >
                                            Create
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    
                                    {isLoadingExercises ? (
                                        <Spinner />
                                    ) : (
                                        <Table
                                            aria-label="Exercise list"
                                            removeWrapper
                                            hideHeader
                                            selectionMode="single"
                                            selectionBehavior="toggle"
                                            selectedKeys={selectedKey}
                                            onSelectionChange={setSelectedKey}
                                            color="default"
                                            classNames={{
                                                base: "",
                                            }}
                                        >
                                            <TableHeader columns={columns}>
                                                {(column) => (
                                                    <TableColumn key={column.key}>
                                                        {column.label}
                                                    </TableColumn>
                                                )}
                                            </TableHeader>
                                            <TableBody emptyContent={"No exercises found."}>
                                                {filteredExercises.map((exercise: Exercise) => (
                                                    <TableRow key={exercise.name}>
                                                        <TableCell className="text-xs lg:text-sm">{exercise.name}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </>
                            )}
                        </DrawerBody>
                        <DrawerFooter className="flex justify-between">
                            <div>
                                <Button
                                    color="primary"
                                    variant="light"
                                    onPress={() => {
                                        setIsCreating(true);
                                    }}
                                >
                                    Create New
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    color="default"
                                    variant="flat"
                                    size="sm"
                                    onPress={() => {
                                        onOpenChange();
                                        clearState();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    color="primary"
                                    variant="solid"
                                    size="sm"
                                    isDisabled={
                                        !(selectedKey instanceof Set) || 
                                        selectedKey.size === 0 ||
                                        isCreating
                                    }
                                    onPress={() => {
                                        onAdd();
                                        onClose();
                                    }}
                                >
                                    {!update ? "Add" : "Update"}
                                </Button>
                            </div>
                        </DrawerFooter>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    );
}