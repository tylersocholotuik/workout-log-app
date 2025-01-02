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

import { getLocalTimeZone, parseDate } from "@internationalized/date";

import { useWorkoutContext } from "@/pages/workout/[workoutId]";

interface WorkoutDetailsModalProps {
    isOpen: boolean,
    onOpenChange: () => void
}

export default function WorkoutDetailsModal({ isOpen, onOpenChange }: WorkoutDetailsModalProps) {
    const { workout, setWorkout } = useWorkoutContext();

    const [title, setTitle] = useState(workout.title);
    const [date, setDate] = useState(workout.date);
    const [notes, setNotes] = useState(workout.notes);
    const [titleError, setTitleError] = useState("");
    const [notesError, setNotesError] = useState("");
    const [dateError, setDateError] = useState("");

    const saveChanges = () => {
        const updatedWorkout = {
            ...workout,
            title: title,
            date: date,
            notes: notes,
        };

        setWorkout(updatedWorkout);
    };

    const isValid = (title: string, notes: string, date: string) => {
        setTitleError("");
        setDateError("");
        setNotesError("");

        if (title.length === 0) {
            setTitleError("Title is required.");
            return false;
        }

        if (title.length > 50) {
            setTitleError("Title must be 50 characters or less.");
            return false;
        }

        if (notes.length > 250) {
            setNotesError("Notes must be 250 characters or less.");
            return false;
        }

        if (!date) {
            setDateError("Date is required");
            return false;
        }

        return true;
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
                                isRequired
                                maxLength={50}
                                description={`${ title ? title.length : "0"}/50 characters`}
                                errorMessage={titleError}
                                isInvalid={titleError !== ""}
                                value={title}
                                onValueChange={setTitle}
                                onChange={() => setTitleError("")}
                            />
                            <DatePicker
                                label="Date"
                                variant="bordered"
                                isRequired
                                errorMessage={dateError}
                                isInvalid={dateError !== ""}
                                value={parseDate(
                                    new Date(date).toISOString().split("T")[0]
                                )}
                                onChange={(newValue) => {
                                    setDate(
                                        newValue?.toDate(getLocalTimeZone())
                                    );
                                    setDateError("");
                                }
                                }
                            />
                            <Textarea
                                label="Notes"
                                variant="bordered"
                                description={`${notes !== "" ? notes.length : "0"}/250 characters`}
                                maxLength={250}
                                errorMessage={notesError}
                                isInvalid={notesError !== ""}
                                minRows={1}
                                value={notes}
                                onValueChange={setNotes}
                                onChange={() => {
                                    setNotesError("");
                                }}
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
                                color="primary"
                                variant="solid"
                                onPress={() => {
                                    if (isValid(title, notes, date)) {
                                        saveChanges();
                                        onClose();
                                    }
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
