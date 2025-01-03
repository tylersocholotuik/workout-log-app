import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@nextui-org/react";

import { ExerciseHistory } from "@/utils/models/models";

interface ExerciseHistoryModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    exerciseHistory: ExerciseHistory[];
    exerciseName: string;
}

export default function ExerciseHistoryModal({
    isOpen,
    onOpenChange,
    exerciseHistory,
    exerciseName
}: ExerciseHistoryModalProps) {
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            {exerciseName} History
                        </ModalHeader>
                        <ModalBody>
                            {exerciseHistory.length > 0 ? (
                                <>
                                    {exerciseHistory.map((exercise, eIndex) => (
                                        <div key={`exercise-history-${eIndex}`} className="mb-2">
                                            <p className="font-bold">
                                                {new Date(
                                                    exercise.workout.date
                                                ).toLocaleDateString("en-CA", {
                                                    dateStyle: "full",
                                                })}
                                            </p>
                                            <p className="mb-2">
                                                {exercise.notes}
                                            </p>
                                            <ul>
                                                {exercise.sets.map(
                                                    (set, sIndex) => (
                                                        <li
                                                            key={`ex-${eIndex}-set-${sIndex}`}
                                                        >
                                                            {`${set.weight} ${exercise.weightUnit} x ${set.reps} reps @ RPE ${set.rpe}`}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div>
                                    <p className="text-foreground-500">
                                        You have not performed this exercise
                                        before.
                                    </p>
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                color="primary"
                                variant="solid"
                                onPress={onClose}
                            >
                                Done
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}
