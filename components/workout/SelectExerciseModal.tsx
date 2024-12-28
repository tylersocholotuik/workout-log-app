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
    Tabs,
    Tab,
    Alert,
} from "@nextui-org/react";

import { SearchIcon } from "@/icons/SearchIcon";

import { Exercise, UserExercise } from "@/utils/models/models";
import {
    getUserExercises,
    getStockExercises,
    addUserExercise,
} from "@/utils/api/exercises";

export default function SelectExerciseModal({
    userId,
    isOpen,
    onOpenChange,
    callbackFunction,
}) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [userExercises, setUserExercises] = useState<UserExercise[]>([]);
    const [selectedKey, setSelectedKey] = useState<Selection>(new Set());
    const [selectedTab, setSelectedTab] = useState("stock-exercises");
    const [filterValue, setFilterValue] = useState("");
    const [userFilterValue, setUserFilterValue] = useState("");
    const [filteredExercises, setFilteredExercises] = useState(exercises);
    const [filteredUserExercises, setFilteredUserExercises] =
        useState(userExercises);
    const [exerciseName, setExerciseName] = useState("");
    const [newExercise, setNewExercise] = useState<UserExercise>(new UserExercise())
    const [isCreating, setisCreating] = useState(false);
    const [error, setError] = useState("");
    const [feedback, setFeedback] = useState("");

    useEffect(() => {
        loadExercises(userId);
    }, []);

    useEffect(() => {
        // update the filtered exercises when the tab changes
        if (selectedTab === "stock-exercises") {
            setFilteredExercises(
                filterValue
                    ? exercises.filter((exercise) =>
                          exercise.name
                              .toLowerCase()
                              .includes(filterValue.toLowerCase())
                      )
                    : exercises
            );
        }
        if (selectedTab === "user-exercises") {
            setFilteredUserExercises(
                userFilterValue
                    ? userExercises.filter((exercise) =>
                          exercise.name
                              .toLowerCase()
                              .includes(userFilterValue.toLowerCase())
                      )
                    : userExercises
            );
        }
    }, [selectedTab, exercises, userExercises, filterValue, userFilterValue]);

    const loadExercises = async (userId: string | string[] | undefined) => {
        try {
            const data = await getStockExercises();
            setExercises(data);
            const userData = await getUserExercises(userId);
            setUserExercises(userData);
        } catch (error) {
            if (error instanceof Error) {
                console.error(error.message);
            }
        }
    };

    // gets the selected exercise id, and returns the exercise that matches the id
    const getSelectedExercise = () => {
        const selectedId = Array.from(selectedKey).pop();

        if (selectedTab === "stock-exercises") {
            return selectedId
                ? exercises.find(
                      (exercise) => exercise.id === Number(selectedId)
                  )
                : null;
        }
        if (selectedTab === "user-exercises") {
            return selectedId
                ? userExercises.find(
                      (exercise) => exercise.id === Number(selectedId)
                  )
                : null;
        }
    };

    const onSearch = (value: string, type: string) => {
        if (type === "stock") {
            setFilterValue(value);
            setFilteredExercises(
                value
                    ? exercises.filter((exercise) =>
                          exercise.name
                              .toLowerCase()
                              .includes(value.toLowerCase())
                      )
                    : exercises
            );
        } else if (type === "user") {
            setUserFilterValue(value);
            setFilteredUserExercises(
                value
                    ? userExercises.filter((exercise) =>
                          exercise.name
                              .toLowerCase()
                              .includes(value.toLowerCase())
                      )
                    : userExercises
            );
        }
    };

    const createNewExercise = async (userId: string, name: string) => {
        setError("");
        setFeedback("");
        setisCreating(true);

        try {
            if (name.trim() === "") {
                throw new Error(`Please enter an exercise name.`);
            }

            const nameIsTaken =
                exercises.some(
                    (exercise) =>
                        name.trim().toLowerCase() ===
                        exercise.name.toLowerCase()
                ) ||
                userExercises.some(
                    (exercise) =>
                        name.trim().toLowerCase() ===
                        exercise.name.toLowerCase()
                );

            if (nameIsTaken) {
                throw new Error(`Exercise name '${name}' already exists.`);
            }

            const newExerciseData = await addUserExercise(userId, exerciseName.trim());
            setNewExercise(newExerciseData);
            // reload userExercises to have access to new exercise
            const userData = await getUserExercises(userId);
            setUserExercises(userData);

            setFeedback(`'${exerciseName}' was created!`);
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            }
        } finally {
            setExerciseName("");
            setisCreating(false);
        }
    };

    const clearState = () => {
        setSelectedKey(new Set());
        setFilterValue("");
        setUserFilterValue("");
        setError("");
        setFeedback("");
        setExerciseName("");
        setSelectedTab("");
        setNewExercise(new UserExercise());
    };

    const onAdd = () => {
        const selectedExercise = getSelectedExercise();
        if (selectedExercise) {
            callbackFunction(selectedExercise);
            clearState();
        }
    };

    const addCreatedExerciseToWorkout = () => {
        // return early if there is no new exercise loaded
        // (default id value for new UserExercise is 0)
        if (newExercise.id === 0) {
            return;
        }

        // add new exercise to workout
        callbackFunction(newExercise);
        clearState();
    }

    const columns = [
        {
            key: "exercise",
            label: "Exercise",
        },
    ];

    return (
        <Modal
            isOpen={isOpen}
            isDismissable={false}
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
                            <Tabs
                                aria-label="Stock or User Exercise Selection"
                                variant="solid"
                                color="primary"
                                radius="sm"
                                className="justify-center z-10 sticky top-0"
                                selectedKey={selectedTab}
                                onSelectionChange={setSelectedTab}
                            >
                                <Tab
                                    key="stock-exercises"
                                    title="Stock Exercises"
                                >
                                    <div className="z-10 sticky top-[50px]">
                                        <Input
                                            isClearable
                                            className="w-full"
                                            placeholder="Search stock exercises..."
                                            startContent={<SearchIcon />}
                                            value={filterValue}
                                            onClear={() => setFilterValue("")}
                                            onValueChange={(newValue) => {
                                                setFilterValue(newValue);
                                                onSearch(newValue, "stock");
                                            }}
                                        />
                                    </div>
                                    <Table
                                        aria-label="Sets table"
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
                                        <TableBody
                                            emptyContent={"No exercises found."}
                                        >
                                            {filteredExercises.map(
                                                (exercise) => (
                                                    <TableRow key={exercise.id}>
                                                        <TableCell>
                                                            {exercise.name}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </Tab>
                                <Tab key="user-exercises" title="My Exercises">
                                    <div className="z-10 sticky top-0">
                                        <Input
                                            isClearable
                                            className="w-full"
                                            placeholder="Search my exercises..."
                                            startContent={<SearchIcon />}
                                            value={userFilterValue}
                                            onClear={() =>
                                                setUserFilterValue("")
                                            }
                                            onValueChange={(newValue) => {
                                                setUserFilterValue(newValue);
                                                onSearch(newValue, "user");
                                            }}
                                        />
                                    </div>
                                    <Table
                                        aria-label="Sets table"
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
                                        <TableBody
                                            emptyContent={"No exercises found."}
                                        >
                                            {filteredUserExercises.map(
                                                (exercise) => (
                                                    <TableRow key={exercise.id}>
                                                        <TableCell>
                                                            {exercise.name}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </Tab>
                                <Tab key="create-exercise" title="Create New">
                                    <div className="">
                                        <h3 className="text-md text-center mb-4">
                                            Create new exercise
                                        </h3>
                                        <div className="mb-4">
                                            <Input
                                                id="exercise-name"
                                                label="Exercise Name"
                                                variant="bordered"
                                                description="Can not have the same name as a stock exercise."
                                                isInvalid={error !== ""}
                                                errorMessage={error}
                                                value={exerciseName}
                                                onValueChange={setExerciseName}
                                                onChange={() => setError("")}
                                            />
                                        </div>
                                        {feedback !== "" && (
                                            <div className="mb-4">
                                                <Alert
                                                    color="success"
                                                    description={feedback}
                                                    isVisible={feedback !== ""}
                                                    title="Success"
                                                    variant="faded"
                                                    onClose={() =>
                                                        setFeedback("")
                                                    }
                                                    endContent={
                                                        <Button
                                                            color="success"
                                                            size="sm"
                                                            variant="flat"
                                                            onPress={() => {
                                                                addCreatedExerciseToWorkout();
                                                                onClose();
                                                            }}
                                                        >
                                                            Add
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                        )}
                                        <div className="flex justify-center">
                                            <Button
                                                color="primary"
                                                isLoading={isCreating}
                                                onPress={() =>
                                                    createNewExercise(
                                                        userId,
                                                        exerciseName
                                                    )
                                                }
                                            >
                                                Create
                                            </Button>
                                        </div>
                                    </div>
                                </Tab>
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="ghost"
                                onPress={() => {
                                    clearState();
                                    onClose();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                variant="solid"
                                isDisabled={selectedKey.size === 0}
                                onPress={() => {
                                    onAdd();
                                    onClose();
                                }}
                            >
                                Add
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
