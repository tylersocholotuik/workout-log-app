import { useEffect, useState } from "react";

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
  addToast,
  Spinner,
} from "@heroui/react";

import { SearchIcon } from "@/icons/SearchIcon";

import { Exercise } from "@/utils/models/models";
import {
  getUserExercises,
  getStockExercises,
  addUserExercise,
} from "@/utils/api/exercises";

interface SelectExerciseModalProps {
  userId: string | string[] | undefined;
  isOpen: boolean;
  onOpenChange: () => void;
  callbackFunction: (newExercise: Exercise, exerciseIndex?: number) => void;
  exerciseIndex?: number;
  update: boolean;
}

export default function SelectExerciseModal({
  userId,
  isOpen,
  onOpenChange,
  callbackFunction,
  exerciseIndex,
  update,
}: SelectExerciseModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedKey, setSelectedKey] = useState<Selection>(new Set());
  const [filterValue, setFilterValue] = useState("");
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [exerciseName, setExerciseName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExercises(userId);
  }, [userId]);

  useEffect(() => {
    setFilteredExercises(
      filterValue
        ? exercises.filter((exercise) =>
            exercise.name.toLowerCase().includes(filterValue.toLowerCase())
          )
        : exercises
    );
  }, [exercises, filterValue]);

  const loadExercises = async (userId: string | string[] | undefined) => {
    try {
      if (!userId) {
        return;
      }
      const data = await getStockExercises();
      const userData = await getUserExercises(userId);
      setExercises([...data, ...userData]);
    } catch (error) {
      addToast({
        title: "Error loading exercises",
        description: error instanceof Error ? error.message : "Unknown error",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // gets the selected exercise id, and returns the exercise that matches the id
  const getSelectedExercise = () => {
    const selectedExercise = Array.from(selectedKey).pop();

    return selectedExercise
      ? exercises.find((exercise) => exercise.name === selectedExercise)
      : null;
  };

  const createNewExercise = async (
    userId: string | string[] | undefined,
    name: string
  ) => {
    setError("");
    setIsSaving(true);

    try {
      if (name.trim() === "") {
        throw new Error(`Please enter an exercise name.`);
      }

      const nameIsTaken =
        exercises.some(
          (exercise) =>
            name.trim().toLowerCase() === exercise.name.toLowerCase()
        ) ||
        exercises.some(
          (exercise) =>
            name.trim().toLowerCase() === exercise.name.toLowerCase()
        );

      if (nameIsTaken) {
        throw new Error(`Exercise name '${name}' already exists.`);
      }

      const newExerciseData = await addUserExercise(
        userId,
        exerciseName.trim()
      );

      // reload exercises to have access to new exercise
      await loadExercises(userId);


      addToast({
        description: `Exercise '${exerciseName}' was created!`,
        color: "success",
        timeout: 5000,
        endContent: (
          <Button
            color="success"
            size="sm"
            variant="flat"
            onPress={() => {
              addCreatedExerciseToWorkout(newExerciseData);
              setIsCreating(false);
              onOpenChange();
            }}
          >
            Add
          </Button>
        ),
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setExerciseName("");
      setIsSaving(false);
    }
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
                  <div className="mb-4">
                    <Input
                      id="exercise-name"
                      label="Exercise Name"
                      variant="bordered"
                      size="sm"
                      description="Can not have the same name as a stock exercise."
                      isInvalid={error !== ""}
                      errorMessage={error}
                      value={exerciseName}
                      onValueChange={setExerciseName}
                      onChange={() => setError("")}
                    />
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="flat"
                      size="sm"
                      onPress={() => setIsCreating(false)}
                    >
                      Back
                    </Button>
                    <Button
                      color="primary"
                      size="sm"
                      isLoading={isSaving}
                      onPress={() => createNewExercise(userId, exerciseName)}
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
                  {isLoading ? (
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
                        {filteredExercises.map((exercise) => (
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
