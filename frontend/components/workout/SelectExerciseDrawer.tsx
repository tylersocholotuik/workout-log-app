import {useState, useMemo} from "react";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

import {useMediaQuery} from "react-responsive";

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
    Select,
    SelectItem,
    Selection,
    Input,
    Form,
    addToast,
    Spinner,
    CheckboxGroup,
    Checkbox
} from "@heroui/react";

import {SearchIcon} from "@/icons/SearchIcon";

import {Exercise, ExerciseType} from "@/types";

import {EXERCISE_TYPE_LABELS} from "@/lib/constants/labels";

import {
    getExercises,
    addUserExercise,
} from "@/lib/api/exercises";

interface ExerciseCreationError<TField extends string = "exerciseName" | "exerciseType"> {
    field: TField;
    message: string;
}

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
    // used for filtering exercises by type (reps, time, cardio)
    const [checkedExerciseTypes, setCheckedExerciseTypes] = useState(Object.keys(EXERCISE_TYPE_LABELS) as string[]);
    // used for selecting the exercise type when creating a new exercise. Default to reps.
    const [selectedExerciseType, setSelectedExerciseType] = useState(new Set<string>([Object.keys(EXERCISE_TYPE_LABELS)[0]]));
    const [filterValue, setFilterValue] = useState("");
    const [exerciseName, setExerciseName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<ExerciseCreationError | null>(null);

    const isMobile = useMediaQuery({maxWidth: 1024});

    const {data: exercises = [], isLoading: isLoadingExercises} = useQuery({
        queryKey: ["exercises"],
        queryFn: getExercises
    });

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

            // Filter exercises by selected exercise types
            filteredExercises = filteredExercises.filter((exercise: Exercise) =>
                checkedExerciseTypes.includes(exercise.exerciseType));

            return filteredExercises;
        },
        [exercises, filterValue, checkedExerciseTypes]
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
        mutationFn: (newExercise: {
            name: string;
            exerciseType: ExerciseType
        }) => addUserExercise(newExercise.name, newExercise.exerciseType),
        // This mutation already shows its own inline field error on failure -
        // skip the global error toast to avoid showing the same message twice.
        meta: {skipGlobalErrorToast: true},
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
            setError({
                field: "exerciseName",
                message: error instanceof Error ? error.message : "An unknown error occurred"
            });
        }
    });

    const handleExerciseTypeSelectionChange = (keys: Selection) => {
        // single-selection Select: "all" can't actually occur here, but the
        // callback type covers it, so guard it out rather than casting blindly
        if (keys === "all") {
            return;
        }

        setSelectedExerciseType(keys as Set<string>);
    };

    const createNewExercise = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setError(null);

        if (exerciseName.trim() === "") {
            setError({
                field: "exerciseName",
                message: "Please enter an exercise name."
            });
            return;
        }
        
        // Ensure that exactly one exercise type is selected
        // This should always be the case due to the single-selection nature of the Select component, but we check just in case
        if (selectedExerciseType.size !== 1) {
            setError({
                field: "exerciseType",
                message: "Please select exactly one exercise type."
            });
            return;
        }

        newExerciseMutation.mutate({
            name: exerciseName.trim(),
            exerciseType: Array.from(selectedExerciseType).pop() as ExerciseType
        });

        setExerciseName("");
    };

    const clearState = () => {
        setSelectedKey(new Set());
        setFilterValue("");
        setError(null);
        setExerciseName("");
        setSelectedExerciseType(new Set<string>([Object.keys(EXERCISE_TYPE_LABELS)[0]]));
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
        {
            key: "type",
            label: "Type",
        }
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
                                    <CheckboxGroup
                                        classNames={{label: "text-sm"}}
                                        label="Exercise Types"
                                        orientation="horizontal"
                                        size="sm"
                                        value={checkedExerciseTypes}
                                        onValueChange={setCheckedExerciseTypes}
                                    >
                                        {Object.entries(EXERCISE_TYPE_LABELS).map(([key, label]) => (
                                            <Checkbox key={key} value={key} classNames={{label: "text-tiny"}}>
                                                {label}
                                            </Checkbox>
                                        ))}
                                    </CheckboxGroup>
                                    <Input
                                        className="w-full mt-4"
                                        placeholder="Search exercises..."
                                        size={isMobile ? "sm" : "md"}
                                        startContent={<SearchIcon/>}
                                        value={filterValue}
                                        onClear={() => setFilterValue("")}
                                        onValueChange={setFilterValue}
                                    />
                                </div>
                            }
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
                                            validate={() => error?.field === "exerciseName" ? error.message : undefined}
                                            value={exerciseName}
                                            onValueChange={setExerciseName}
                                            onChange={() => setError(null)}
                                        />
                                        <Select
                                            isRequired
                                            id="exercise-type"
                                            name="exerciseType"
                                            label="Exercise Type"
                                            description="Determines which fields you will log for each set."
                                            size="sm"
                                            variant="bordered"
                                            disallowEmptySelection
                                            selectedKeys={selectedExerciseType}
                                            onSelectionChange={handleExerciseTypeSelectionChange}
                                            validate={() => error?.field === "exerciseType" ? error.message : undefined}
                                        >
                                            {Object.entries(EXERCISE_TYPE_LABELS).map(([key, label]) => (
                                                <SelectItem key={key}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    </Form>
                                    <div className="flex justify-center gap-2">
                                        <Button
                                            variant="flat"
                                            size="sm"
                                            onPress={() => {
                                                setIsCreating(false);
                                                setExerciseName("");
                                                setSelectedExerciseType(new Set<string>([Object.keys(EXERCISE_TYPE_LABELS)[0]]));
                                                setError(null);
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
                                        <Spinner/>
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
                                                        <TableCell
                                                            className="text-xs lg:text-sm">{exercise.name}</TableCell>
                                                        <TableCell className="text-tiny text-gray-500">
                                                            {EXERCISE_TYPE_LABELS[exercise.exerciseType]}
                                                        </TableCell>
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