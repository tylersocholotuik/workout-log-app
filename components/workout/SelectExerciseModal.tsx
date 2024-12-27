import { useContext, useState } from "react";

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
    Selection
} from "@nextui-org/react";

import { WorkoutContext } from "@/pages/[userId]/workout/[workoutId]";

export default function SelectExerciseModal({
    exercises,
    isOpen,
    onOpenChange,
    callbackFunction,
}) {

    const [selectedKey, setSelectedKey] = useState<Selection>(new Set());

    // gets the selected exercise id, and returns the exercise that matches the id
    const getSelectedExercise = () => {
        const selectedId = Array.from(selectedKey).pop();
        return selectedId ? exercises.find((exercise) => exercise.id === Number(selectedId)) : null;
    };

    const columns = [
        {
            key: "exercise",
            label: "Exercise",
        },
    ];

    // TODO: Add search input, include user exercises

    return (
        <Modal
            isOpen={isOpen}
            placement="top-center"
            scrollBehavior="inside"
            onOpenChange={onOpenChange}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            Select Exercise
                        </ModalHeader>
                        <ModalBody>
                            <p>{Object.keys(selectedKey)}</p>
                            <Table
                                aria-label="Sets table"
                                removeWrapper
                                selectionMode="single"
                                selectionBehavior="toggle"
                                selectedKeys={selectedKey}
                                onSelectionChange={setSelectedKey}
                                color="default"
                            >
                                <TableHeader columns={columns}>
                                    {(column) => (
                                        <TableColumn key={column.key}>
                                            {column.label}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody>
                                    {exercises.map((exercise) => (
                                        <TableRow key={exercise.id}>
                                            <TableCell>
                                                {exercise.name}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="faded"
                                onPress={() => {
                                    setSelectedKey(new Set());
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
                                    const selectedExercise = getSelectedExercise();
                                    if (selectedExercise) {
                                        callbackFunction(selectedExercise);
                                        setSelectedKey(new Set());
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
