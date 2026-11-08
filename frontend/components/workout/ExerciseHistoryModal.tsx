import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Spinner,
} from "@heroui/react";

import {ExerciseHistory} from "@/types";
import {DISTANCE_UNIT_LABELS} from "@/lib/constants/labels";
import {formatWorkoutDate} from "@/utils/workoutDate";

interface ExerciseHistoryModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
    exerciseHistory: ExerciseHistory[];
    isLoading: boolean;
    exerciseName: string;
}

export default function ExerciseHistoryModal({
                                                 isOpen,
                                                 onOpenChange,
                                                 exerciseHistory,
                                                 isLoading,
                                                 exerciseName
                                             }: ExerciseHistoryModalProps) {

    return (

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside" placement="center">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            {exerciseName} History
                        </ModalHeader>
                        <ModalBody>
                            {isLoading ? (
                                <div className="flex justify-center py-4">
                                    <Spinner/>
                                </div>
                            ) : exerciseHistory.length > 0 ? (
                                <>
                                    {exerciseHistory.map((exercise, eIndex) => (
                                        <div key={`exercise-history-${eIndex}`} className="mb-2">
                                            <p className="font-bold">
                                                {formatWorkoutDate(exercise.workout.date, {
                                                    dateStyle: "full",
                                                })}
                                            </p>
                                            <p className="mb-2 text-foreground-500 text-sm">
                                                {exercise.notes}
                                            </p>
                                            <ul>
                                                {exercise.sets.map(
                                                    (set, sIndex) => {
                                                        let setDescription = "";
                                                        
                                                        const weightDisplay = set.weight !== null ? `${set.weight} ${exercise.weightUnit}` : "Bodyweight";
                                                        const distanceUnitLabel = DISTANCE_UNIT_LABELS[exercise.distanceUnit] || exercise.distanceUnit;
                                                        const minutes = set.durationSeconds ? Math.floor(set.durationSeconds / 60) : 0;
                                                        const seconds = set.durationSeconds ? set.durationSeconds % 60 : 0;
                                                        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
                                                        const durationDisplay = set.durationSeconds !== null ? formattedDuration : "";
                                                        const effortRatingDisplay = set.effortRating !== null ? `@ ${exercise.effortType.toUpperCase()} ${set.effortRating}` : "";
                                                        const cardioDistance = set.distance !== null ? set.distance + " " + distanceUnitLabel + (set.durationSeconds !== null ? ", " : "") : "";

                                                        switch (exercise.exerciseType) {
                                                            case "reps":
                                                                if (set.weight === null && set.reps === null) {
                                                                    setDescription = "Empty Set";
                                                                } else {
                                                                    setDescription = `${weightDisplay} x ${set.reps ?? "-"} reps ${effortRatingDisplay}`;
                                                                }
                                                                break;
                                                            case "distance":
                                                                if (set.weight === null && set.distance === null) {
                                                                    setDescription = "Empty Set";
                                                                } else {
                                                                    setDescription = `${weightDisplay} x ${set.distance ?? "-"} ${distanceUnitLabel} ${effortRatingDisplay}`;
                                                                }
                                                                break;
                                                            case "time":
                                                                if (set.weight === null && set.durationSeconds === null) {
                                                                    setDescription = "Empty Set";
                                                                } else {
                                                                    setDescription = `${weightDisplay} x ${durationDisplay || "-"} ${effortRatingDisplay}`;
                                                                }
                                                                break;
                                                            case "cardio":
                                                                if (set.distance === null && set.durationSeconds === null) {
                                                                    setDescription = "Empty Set";
                                                                } else {
                                                                    setDescription = `${cardioDistance}${durationDisplay} ${effortRatingDisplay}`.trimStart();
                                                                }
                                                                break;
                                                        }

                                                        return <li
                                                            key={`ex-${eIndex}-set-${sIndex}`}
                                                            className="text-sm"
                                                        >
                                                            {setDescription}
                                                        </li>
                                                    }
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
