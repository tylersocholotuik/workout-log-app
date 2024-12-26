import { useContext } from "react";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    DatePicker,
    Input,
    Textarea,
} from "@nextui-org/react";

import { CalendarDate, parseDate } from "@internationalized/date";

import { WorkoutContext } from "@/pages/[userId]/workout/[workoutId]";

export default function WorkoutDetailsModal({ isOpen, onOpenChange }) {
    const { workout, setWorkout } = useContext(WorkoutContext);

    const handleInputChange = (field: string, value: string | CalendarDate | null) => {
        const updatedWorkout = {
            ...workout,
            [field]: value,
        };

        setWorkout(updatedWorkout);
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                placement="top-center"
                onOpenChange={onOpenChange}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Workout Details
                            </ModalHeader>
                            <ModalBody>
                                <Input
                                    label="Workout Title"
                                    variant="bordered"
                                    value={workout.title}
                                    onValueChange={(newValue) =>
                                        handleInputChange("title", newValue)
                                    }
                                />
                                <DatePicker
                                    label="Date"
                                    variant="bordered"
                                    value={parseDate(
                                        new Date(workout.date).toLocaleDateString("en-CA")
                                    )}
                                    onChange={(newValue) =>
                                        handleInputChange("date", newValue)
                                    }
                                />
                                <Textarea
                                    label="Notes"
                                    variant="bordered"
                                    minRows={1}
                                    value={workout.notes}
                                    onValueChange={(newValue) =>
                                        handleInputChange("notes", newValue)
                                    }
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="danger"
                                    variant="light"
                                    onPress={onClose}
                                >
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
