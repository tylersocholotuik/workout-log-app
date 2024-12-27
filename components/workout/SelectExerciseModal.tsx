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
    Selection,
    Input,
    Pagination
} from "@nextui-org/react";

import { SearchIcon } from "@/icons/SearchIcon";

export default function SelectExerciseModal({
    exercises,
    isOpen,
    onOpenChange,
    callbackFunction,
}) {
    const [selectedKey, setSelectedKey] = useState<Selection>(new Set());
    const [filterValue, setFilterValue] = useState('');
    const [filteredExercises, setFilteredExercises] = useState(exercises);

    // gets the selected exercise id, and returns the exercise that matches the id
    const getSelectedExercise = () => {
        const selectedId = Array.from(selectedKey).pop();
        return selectedId
            ? exercises.find((exercise) => exercise.id === Number(selectedId))
            : null;
    };

    const onSearch = (value: string) => {
        let searchedExercises = [...exercises]
        if (value !== '') {
            searchedExercises = searchedExercises.filter((exercise) => {
                return exercise.name.toLowerCase().includes(value.toLowerCase());
            })
        }
        setFilteredExercises(searchedExercises);
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
                            <div className="z-10 sticky top-0">
                                <Input
                                    isClearable
                                    className="w-full"
                                    placeholder="Search exercises..."
                                    startContent={<SearchIcon />}
                                    value={filterValue}
                                    onClear={() => setFilterValue('')}
                                    onValueChange={(newValue) => {
                                        setFilterValue(newValue);
                                        onSearch(newValue);
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
                                    base: 'min-h-[500px]'
                                }}
                            >
                                <TableHeader columns={columns}>
                                    {(column) => (
                                        <TableColumn key={column.key}>
                                            {column.label}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody>
                                    {filteredExercises.map((exercise) => (
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
                                    const selectedExercise =
                                        getSelectedExercise();
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
