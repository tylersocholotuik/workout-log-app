import {useEffect, useState} from "react";

import {useWorkoutContext} from "@/pages/workout/[workoutId]";
import {useWorkoutExercise} from "@/components/workout/WorkoutExerciseProvider";

import {Set} from "@/types";

import {Input, Tooltip, Button} from "@heroui/react";
import {DeleteIcon} from "@/icons/DeleteIcon";

import {handleInputChange, sanitizeDisplayValues} from "@/utils/inputHandlers";

interface SetTableRowProps {
    set: Set;
    setIndex: number;
    exerciseIndex: number;
    weightUnit: string;
}

export default function SetsTableRow({
                                         set,
                                         setIndex,
                                         exerciseIndex,
                                         weightUnit,
                                     }: SetTableRowProps) {
    // ensuring "null" does not appear in inputs, set to empty string instead
    const weightString = set.weight !== null ? String(set.weight) : "";
    const repsString = set.reps !== null ? String(set.reps) : "";
    const effortRatingString = set.effortRating !== null ? String(set.effortRating) : "";
    const targetRepsMinString = set.targetRepsMin !== null ? String(set.targetRepsMin) : "";
    const targetRepsMaxString = set.targetRepsMax !== null ? String(set.targetRepsMax) : "";
    const targetEffortMinString = set.targetEffortMin !== null ? String(set.targetEffortMin) : "";
    const targetEffortMaxString = set.targetEffortMax !== null ? String(set.targetEffortMax) : "";

    const [weight, setWeight] = useState(weightString);
    const [reps, setReps] = useState(repsString);
    const [effortRating, setEffortRating] = useState(effortRatingString);

    const {workout, setWorkout} = useWorkoutContext();
    const {showTargets, effortType} = useWorkoutExercise();

    // Rules for weight:
    //  min: 0, max: 9999, steps of 0.5, can be empty string, only 1 digit after decimal (0 or 5), only 1 decimal
    const WEIGHT_REGEX = /^(\d{0,4})(\.([05]?)?)?$/;
    const WEIGHT_MIN = 0;
    const WEIGHT_MAX = 9999;
    // Rules for reps:
    //  min: 0, max: 9999, must be an integer, can be empty string
    const REPS_REGEX = /^(?:[0-9]{1,4})?$/;
    const REPS_MIN = 0;
    const REPS_MAX = 9999;
    // Rules for effort rating:
    //  min: 0, max: 10, steps of 0.5 (RPE only), can be empty string, only 1 digit after decimal (0 or 5) (RPE only), only 1 decimal
    const RPE_REGEX = /^(10|[0-9](\.\d{0,1})?)?$/;
    const RIR_REGEX = /^(10|[0-9])?$/;
    const effortRatingRegex = effortType === "rpe" ? RPE_REGEX : RIR_REGEX;
    const EFFORT_RATING_MIN = 0;
    const EFFORT_RATING_MAX = 10;
    const effortRatingIsInteger = effortType === "rir";

    // Resyncs displayed weight, reps, and effort rating whenever the underlying set
    // changes externally (e.g. effort type conversion, or another set being deleted
    // shifts this row's index and therefore which set it renders).
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWeight(set.weight !== null ? String(set.weight) : "");
    }, [set.weight]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReps(set.reps !== null ? String(set.reps) : "");
    }, [set.reps]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEffortRating(
            set.effortRating !== null ? String(set.effortRating) : ""
        );
    }, [set.effortRating]);
    
    // below the minimum is always bad; above the maximum is only "good" when
    // both bounds are set (a deliberate range, not just a floor)
    const getRepsTextColor = () => {
        if (set.reps === null) {
            return "";
        }

        if (set.targetRepsMin !== null && set.reps < set.targetRepsMin) {
            return "text-danger";
        }

        if (set.targetRepsMax !== null && set.targetRepsMin !== null && set.reps > set.targetRepsMax) {
            return "text-success";
        }

        return "";
    };

    const repsTextColor = getRepsTextColor();

    // direction of "good" vs "bad" depends on training goal, so outside the
    // target range is just flagged as a warning rather than good/bad
    const getEffortTextColor = () => {
        if (set.effortRating === null) {
            return "";
        }

        if (
            (set.targetEffortMin !== null && set.effortRating < set.targetEffortMin) ||
            (set.targetEffortMax !== null && set.effortRating > set.targetEffortMax)
        ) {
            return "text-warning";
        }

        return "";
    };

    const effortTextColor = getEffortTextColor();

    const isFixedRepsTarget = set.targetRepsMin !== null && set.targetRepsMax !== null && set.targetRepsMin === set.targetRepsMax;
    const isFixedEffortTarget = set.targetEffortMin !== null && set.targetEffortMax !== null && set.targetEffortMin === set.targetEffortMax;
    const hasTargets = set.targetRepsMin !== null || set.targetRepsMax !== null || set.targetEffortMin !== null || set.targetEffortMax !== null;
    
    const getRepsTargetDescription = () => {
        if (!showTargets || !hasTargets || (set.targetRepsMin === null && set.targetRepsMax === null)) {
            return undefined;
        }

        if (isFixedRepsTarget) {
            return `Target: ${targetRepsMinString}`;
        } else if (set.targetRepsMin === null && set.targetRepsMax !== null) {
            return `Target: <= ${targetRepsMaxString}`;
        } else if (set.targetRepsMin !== null && set.targetRepsMax === null) {
            return `Target: >= ${targetRepsMinString}`;
        } else {
            return `Target: ${targetRepsMinString}-${targetRepsMaxString}`;
        }
    };
    
    const repsTargetDescription = getRepsTargetDescription();
    
    const getEffortTargetDescription = () => {
        if (!showTargets || !hasTargets || (set.targetEffortMin === null && set.targetEffortMax === null)) {
            return undefined;
        }

        if (isFixedEffortTarget) {
            return `Target: ${targetEffortMinString}`;
        } else if (set.targetEffortMin === null && set.targetEffortMax !== null) {
            return `Target: <= ${targetEffortMaxString}`;
        } else if (set.targetEffortMin !== null && set.targetEffortMax === null) {
            return `Target: >= ${targetEffortMinString}`;
        } else {
            return `Target: ${targetEffortMinString}-${targetEffortMaxString}`;
        }
    };

    const effortTargetDescription = getEffortTargetDescription();

    // called on focus blur for all inputs
    // updates the state of the workout with the set
    // at the current exercise and set index
    const saveChanges = () => {
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, eIndex) =>
                eIndex === exerciseIndex
                    ? {
                        ...exercise,
                        sets: exercise.sets.map((set, sIndex) =>
                            sIndex === setIndex
                                ? {
                                    ...set,
                                    weight:
                                        weight !== ""
                                            ? parseFloat(weight)
                                            : null,
                                    reps:
                                        reps !== ""
                                            ? parseFloat(reps)
                                            : null,
                                    effortRating:
                                        effortRating !== ""
                                            ? parseFloat(effortRating)
                                            : null,
                                }
                                : set
                        ),
                    }
                    : exercise
            ),
        };

        setWorkout(updatedWorkout);
    };

    const handleBlur = () => {
        sanitizeDisplayValues([
            {value: weight, setter: setWeight, stripTrailingDecimal: true, stripLeadingZero: true},
            {value: reps, setter: setReps, stripLeadingZero: true},
            {value: effortRating, setter: setEffortRating, stripTrailingDecimal: true},
        ]);
        saveChanges();
    };

    const deleteSet = (setIndex: number) => {
        const updatedSets = workout.exercises[exerciseIndex].sets.filter(
            (_, index) => index !== setIndex
        );

        // Update the global workout context after deleting a set
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                        ...exercise,
                        sets: updatedSets,
                    }
                    : exercise
            ),
        };

        setWorkout(updatedWorkout);
    };

    return (
        <>
            <div className="col-span-2">
                <Input
                    classNames={{input: "text-center"}}
                    id={`exercise-${exerciseIndex}-set-${setIndex}-weight`}
                    inputMode="decimal"
                    variant="bordered"
                    size="sm"
                    aria-label="weight"
                    color="primary"
                    endContent={
                        <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                                {weightUnit}
                            </span>
                        </div>
                    }
                    value={weight}
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: WEIGHT_REGEX,
                            isInteger: false,
                            minValue: WEIGHT_MIN,
                            maxValue: WEIGHT_MAX,
                            setter: setWeight,
                        });
                    }}
                    onBlur={handleBlur}
                />
            </div>
            <div className="col-span-2">
                <Input
                    classNames={{input: `text-center ${repsTextColor}`, description: "text-center"}}
                    id={`exercise-${exerciseIndex}-set-${setIndex}-reps`}
                    inputMode="decimal"
                    variant="bordered"
                    size="sm"
                    aria-label="reps"
                    color="primary"
                    value={reps}
                    description={repsTargetDescription}
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: REPS_REGEX,
                            isInteger: true,
                            minValue: REPS_MIN,
                            maxValue: REPS_MAX,
                            setter: setReps,
                        });
                    }}
                    onBlur={handleBlur}
                />
            </div>
            <div className="col-span-2">
                <Input
                    className=""
                    classNames={{input: `text-center ${effortTextColor}`, description: "text-center"}}
                    id={`exercise-${exerciseIndex}-set-${setIndex}-effort-rating`}
                    inputMode="decimal"
                    variant="bordered"
                    size="sm"
                    aria-label="effort rating"
                    color="primary"
                    value={effortRating}
                    description={effortTargetDescription}
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: effortRatingRegex,
                            isInteger: effortRatingIsInteger,
                            minValue: EFFORT_RATING_MIN,
                            maxValue: EFFORT_RATING_MAX,
                            setter: setEffortRating,
                        });
                    }}
                    onBlur={handleBlur}
                />
            </div>
            <div>
                <Tooltip content="Delete Set">
                    <Button
                        isIconOnly
                        aria-label="delete set"
                        color="danger"
                        variant="light"
                        onPress={() => deleteSet(setIndex)}
                    >
                        <DeleteIcon/>
                    </Button>
                </Tooltip>
            </div>
        </>
    );
}
