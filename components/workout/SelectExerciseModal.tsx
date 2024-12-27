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
} from "@nextui-org/react";

import { SearchIcon } from "@/icons/SearchIcon";

export default function SelectExerciseModal({
    exercises,
    userExercises,
    isOpen,
    onOpenChange,
    callbackFunction,
}) {
    const [selectedKey, setSelectedKey] = useState<Selection>(new Set());
    const [selectedTab, setSelectedTab] = useState("stock-exercises");
    const [filterValue, setFilterValue] = useState("");
    const [userFilterValue, setUserFilterValue] = useState("");
    const [filteredExercises, setFilteredExercises] = useState(exercises);
    const [filteredUserExercises, setFilteredUserExercises] = useState(userExercises);

    useEffect(() => {
        // update the filtered exercises when the tab changes
        if (selectedTab === "stock-exercises") {
            setFilteredExercises(
                filterValue
                    ? exercises.filter((exercise) =>
                          exercise.name.toLowerCase().includes(filterValue.toLowerCase())
                      )
                    : exercises
            );
        }
        if (selectedTab === "user-exercises") {
            setFilteredUserExercises(
                userFilterValue
                    ? userExercises.filter((exercise) =>
                          exercise.name.toLowerCase().includes(userFilterValue.toLowerCase())
                      )
                    : userExercises
            );
        }
    }, [selectedTab, exercises, userExercises, filterValue, userFilterValue]);

    // gets the selected exercise id, and returns the exercise that matches the id
    const getSelectedExercise = () => {
        const selectedId = Array.from(selectedKey).pop();

        if (selectedTab === 'stock-exercises') {
            return selectedId
            ? exercises.find((exercise) => exercise.id === Number(selectedId))
            : null;
        }
        if (selectedTab === 'user-exercises') {
            return selectedId
            ? userExercises.find((exercise) => exercise.id === Number(selectedId))
            : null;
        }
    };

    const onSearch = (value: string, type: string) => {
        if (type === "stock") {
            setFilterValue(value);
            setFilteredExercises(
                value
                    ? exercises.filter((exercise) =>
                          exercise.name.toLowerCase().includes(value.toLowerCase())
                      )
                    : exercises
            );
        } else if (type === "user") {
            setUserFilterValue(value);
            setFilteredUserExercises(
                value
                    ? userExercises.filter((exercise) =>
                          exercise.name.toLowerCase().includes(value.toLowerCase())
                      )
                    : userExercises
            );
        }
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
            placement="top-center"
            scrollBehavior="inside"
            size="xs"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Select Exercise
                        </ModalHeader>
                        <ModalBody>
                            <Tabs
                                aria-label="Stock or User Exercise Selection"
                                variant="solid"
                                color="primary"
                                radius="full"
                                selectedKey={selectedTab}
                                onSelectionChange={setSelectedTab}
                            >
                                <Tab
                                    key="stock-exercises"
                                    title="Stock Exercises"
                                >
                                    <div className="z-10 sticky top-0">
                                        <Input
                                            isClearable
                                            className="w-full"
                                            placeholder="Search stock exercises..."
                                            startContent={<SearchIcon />}
                                            value={filterValue}
                                            onClear={() => setFilterValue("")}
                                            onValueChange={(newValue) => {
                                                setFilterValue(newValue);
                                                onSearch(newValue, 'stock');
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
                                            base: "min-h-[500px]",
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => (
                                                <TableColumn key={column.key}>
                                                    {column.label}
                                                </TableColumn>
                                            )}
                                        </TableHeader>
                                        <TableBody emptyContent={'No exercises found.'}>
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
                                <Tab
                                    key="user-exercises"
                                    title="My Exercises"
                                >
                                    <div className="z-10 sticky top-0">
                                        <Input
                                            isClearable
                                            className="w-full"
                                            placeholder="Search my exercises..."
                                            startContent={<SearchIcon />}
                                            value={userFilterValue}
                                            onClear={() => setUserFilterValue("")}
                                            onValueChange={(newValue) => {
                                                setUserFilterValue(newValue);
                                                onSearch(newValue, 'user');
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
                                            base: "min-h-[500px]",
                                        }}
                                    >
                                        <TableHeader columns={columns}>
                                            {(column) => (
                                                <TableColumn key={column.key}>
                                                    {column.label}
                                                </TableColumn>
                                            )}
                                        </TableHeader>
                                        <TableBody emptyContent={'No exercises found.'}>
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
                            </Tabs>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="faded"
                                onPress={() => {
                                    setSelectedKey(new Set());
                                    setFilterValue("");
                                    setUserFilterValue("");
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
                                    const selectedExercise =
                                        getSelectedExercise();
                                    if (selectedExercise) {
                                        callbackFunction(selectedExercise);
                                        setSelectedKey(new Set());
                                        setFilterValue("");
                                        setUserFilterValue("");
                                        onClose();
                                    }
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
