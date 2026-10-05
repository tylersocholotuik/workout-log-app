import { useState, useMemo } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
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

  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery({ queryKey: ["exercises"], queryFn: getExercises });
  
  const filteredExercises = useMemo(
    () =>
      filterValue
        ? exercises.filter((exercise: Exercise) =>
            exercise.name.toLowerCase().includes(filterValue.toLowerCase())
          )
        : exercises,
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
      ]);

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
    <Modal
      isOpen={isOpen}
      isDismissable={true}
      isKeyboardDismissDisabled
      scrollBehavior="inside"
      placement="top"
      size="md"
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center gap-1">
              Select Exercise
            </ModalHeader>
            <ModalBody>
              {isCreating ? (
                <div className="">
                  <h3 className="text-md text-center mb-4">
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
                  <div className="mb-4">
                    <Input
                      className="w-full"
                      placeholder="Search exercises..."
                      startContent={<SearchIcon />}
                      value={filterValue}
                      onClear={() => setFilterValue("")}
                      onValueChange={setFilterValue}
                    />
                  </div>
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
                            <TableCell>{exercise.name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </ModalBody>
            <ModalFooter className="flex justify-between">
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
                  isDisabled={
                    !(selectedKey instanceof Set) || selectedKey.size === 0
                  }
                  onPress={() => {
                    onAdd();
                    onClose();
                  }}
                >
                  {!update ? "Add" : "Update"}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
