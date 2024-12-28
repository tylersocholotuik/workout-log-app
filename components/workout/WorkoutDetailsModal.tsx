import { useContext, useState } from "react";

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

import { CalendarDate, getLocalTimeZone, parseDate } from "@internationalized/date";

import { WorkoutContext } from "@/pages/[userId]/workout/[workoutId]";

export default function WorkoutDetailsModal({ isOpen, onOpenChange }) {
    const { workout, setWorkout } = useContext(WorkoutContext);

    const [title, setTitle] = useState(workout.title);
    const [date, setDate] = useState(workout.date);
    const [notes, setNotes] = useState(workout.notes);

    const saveChanges = () => {

        const updatedWorkout = {
            ...workout,
            title: title,
            date: date,
            notes: notes
        };

        setWorkout(updatedWorkout);
    };

    return (
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
                                value={title}
                                onValueChange={setTitle}
                            />
                            <DatePicker
                                label="Date"
                                variant="bordered"
                                value={parseDate(
                                    new Date(date)
                                        .toISOString()
                                        .split("T")[0]
                                )}
                                onChange={(newValue) =>
                                    setDate(newValue?.toDate(getLocalTimeZone()))
                                }
                            />
                            <Textarea
                                label="Notes"
                                variant="bordered"
                                minRows={1}
                                value={notes}
                                onValueChange={setNotes}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="danger"
                                variant="ghost"
                                onPress={onClose}
                            >
                                Close
                            </Button>
                            <Button
                                color="success"
                                variant="flat"
                                onPress={() => {
                                    saveChanges();
                                    onClose();
                                }}
                            >
                                Save
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
