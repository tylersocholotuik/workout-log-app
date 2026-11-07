import {useEffect, useRef, useState} from "react";

import {useWorkoutContext} from "@/pages/workout/[workoutId]";
import {useWorkoutExercise} from "@/components/workout/WorkoutExerciseProvider";

import {Set} from "@/types";

import {DISTANCE_UNIT_LABELS} from "@/lib/constants/labels";
import {
    WEIGHT_REGEX,
    WEIGHT_MIN,
    WEIGHT_MAX,
    REPS_REGEX,
    REPS_MIN,
    REPS_MAX,
    DISTANCE_REGEX,
    DISTANCE_MIN,
    DISTANCE_MAX,
    DURATION_MINUTES_REGEX,
    DURATION_MINUTES_MIN,
    DURATION_MINUTES_MAX,
    DURATION_SECONDS_REGEX,
    DURATION_SECONDS_MIN,
    DURATION_SECONDS_MAX,
    RPE_REGEX,
    RIR_REGEX,
    EFFORT_RATING_MIN,
    EFFORT_RATING_MAX,
} from "@/lib/constants/validation";

import {Input, Tooltip, Button} from "@heroui/react";
import {DeleteIcon} from "@/icons/DeleteIcon";

import {handleInputChange, sanitizeDisplayValues} from "@/utils/inputHandlers";

interface SetTableRowProps {
    set: Set;
    setIndex: number;
    exerciseIndex: number;
}

export default function SetsTableRow({
                                         set,
                                         setIndex,
                                         exerciseIndex,
                                     }: SetTableRowProps) {
    // ensuring "null" does not appear in inputs, set to empty string instead
    const weightString = set.weight !== null ? String(set.weight) : "";
    const repsString = set.reps !== null ? String(set.reps) : "";
    const distanceString = set.distance !== null ? String(set.distance) : "";
    const effortRatingString = set.effortRating !== null ? String(set.effortRating) : "";
    const targetRepsMinString = set.targetRepsMin !== null ? String(set.targetRepsMin) : "";
    const targetRepsMaxString = set.targetRepsMax !== null ? String(set.targetRepsMax) : "";
    const targetEffortMinString = set.targetEffortMin !== null ? String(set.targetEffortMin) : "";
    const targetEffortMaxString = set.targetEffortMax !== null ? String(set.targetEffortMax) : "";
    const targetDistanceMinString = set.targetDistanceMin !== null ? String(set.targetDistanceMin) : "";
    const targetDistanceMaxString = set.targetDistanceMax !== null ? String(set.targetDistanceMax) : "";
    const durationMinutesString = set.durationSeconds !== null ? String(Math.floor(set.durationSeconds / 60)) : "";
    const durationSecondsString = set.durationSeconds !== null ? String(set.durationSeconds % 60).padStart(2, "0") : "";


    const [weight, setWeight] = useState(weightString);
    const [reps, setReps] = useState(repsString);
    const [distance, setDistance] = useState(distanceString);
    const [durationMinutes, setDurationMinutes] = useState(durationMinutesString);
    const [durationSeconds, setDurationSeconds] = useState(durationSecondsString);
    const [effortRating, setEffortRating] = useState(effortRatingString);

    // durationSeconds is split across two inputs (minutes/seconds), so splitting
    // it back apart after our own save round-trips through `workout` state is
    // lossy (e.g. 0 minutes + 45 seconds and "" minutes + 45 seconds both equal
    // 45). This ref tracks the last value *we* wrote so the resync effect below
    // can skip re-deriving when the change is just our own save coming back,
    // preserving an intentionally-typed "0" instead of blanking it out.
    const lastSavedDurationSeconds = useRef<number | null>(set.durationSeconds);

    const {workout, setWorkout} = useWorkoutContext();

    const {
        showTargets,
        effortType,
        weightUnit,
        distanceUnit,
        exerciseType
    } = useWorkoutExercise();

    const effortRatingRegex = effortType === "rpe" ? RPE_REGEX : RIR_REGEX;
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
        setDistance(set.distance !== null ? String(set.distance) : "");
    }, [set.distance]);

    useEffect(() => {
        // our own saveChanges already wrote this exact value - skip re-deriving
        // from it, otherwise we'd blow away an intentionally-typed "0" in
        // either field (e.g. "0" minutes + "45" seconds and "" minutes + "45"
        // seconds both collapse to the same 45-second total, so splitting the
        // total back apart can't tell which one the user actually typed)
        if (set.durationSeconds === lastSavedDurationSeconds.current) {
            return;
        }

        // a genuinely external change (e.g. exercise type switch resetting
        // sets, or another set's deletion shifting which set this row renders)
        // - safe to derive minutes/seconds fresh from the new total
        lastSavedDurationSeconds.current = set.durationSeconds;

        const minutes = set.durationSeconds !== null ? Math.floor(set.durationSeconds / 60) : null;
        const seconds = set.durationSeconds !== null ? set.durationSeconds % 60 : null;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDurationMinutes(minutes !== null ? String(minutes) : "");
        setDurationSeconds(seconds !== null ? String(seconds).padStart(2, "0") : "");
    }, [set.durationSeconds]);

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
        const durationMinutesInt = durationMinutes !== "" ? parseInt(durationMinutes) : 0;
        const durationSecondsInt = durationSeconds !== "" ? parseInt(durationSeconds) : 0;

        const newDurationSeconds =
            durationMinutes !== "" || durationSeconds !== ""
                ? durationMinutesInt * 60 + durationSecondsInt
                : null;

        // record the value we're about to write so the resync effect can
        // recognize it's our own save coming back and skip re-deriving it
        lastSavedDurationSeconds.current = newDurationSeconds;

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
                                    distance:
                                        distance !== ""
                                            ? parseFloat(distance)
                                            : null,
                                    durationSeconds: newDurationSeconds,
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
            {value: distance, setter: setDistance, stripTrailingDecimal: true, stripLeadingZero: true},
            {value: durationMinutes, setter: setDurationMinutes, stripLeadingZero: true},
            {value: durationSeconds, setter: setDurationSeconds},
            {value: effortRating, setter: setEffortRating, stripTrailingDecimal: true},
        ]);
        
        setDurationSeconds(prev => prev !== "" ? String(parseInt(prev)).padStart(2, "0") : "");
        
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
                {exerciseType === "cardio" ?
                    <Input
                        classNames={{input: "text-center"}}
                        id={`exercise-${exerciseIndex}-set-${setIndex}-distance`}
                        inputMode="decimal"
                        variant="bordered"
                        size="sm"
                        aria-label="distance"
                        color="primary"
                        endContent={
                            <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                                {DISTANCE_UNIT_LABELS[distanceUnit || "meters"]}
                            </span>
                            </div>
                        }
                        value={distance}
                        onValueChange={(value) => {
                            handleInputChange({
                                value,
                                regex: DISTANCE_REGEX,
                                isInteger: false,
                                minValue: DISTANCE_MIN,
                                maxValue: DISTANCE_MAX,
                                step: 0.1,
                                setter: setDistance,
                            });
                        }}
                        onBlur={handleBlur}
                    /> :
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
                }
            </div>
            <div className={exerciseType === "reps" || exerciseType ==="distance" ? "col-span-2" : "col-span-3"}>
                {exerciseType === "reps" ?
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
                    /> : exerciseType === "distance" ?
                        <Input
                            classNames={{input: "text-center"}}
                            id={`exercise-${exerciseIndex}-set-${setIndex}-distance`}
                            inputMode="decimal"
                            variant="bordered"
                            size="sm"
                            aria-label="distance"
                            color="primary"
                            endContent={
                                <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                                {DISTANCE_UNIT_LABELS[distanceUnit || "meters"]}
                            </span>
                                </div>
                            }
                            value={distance}
                            onValueChange={(value) => {
                                handleInputChange({
                                    value,
                                    regex: DISTANCE_REGEX,
                                    isInteger: false,
                                    minValue: DISTANCE_MIN,
                                    maxValue: DISTANCE_MAX,
                                    step: 0.1,
                                    setter: setDistance,
                                });
                            }}
                            onBlur={handleBlur}
                        /> :
                        <div className="flex gap-1 justify-center items-center">
                            <Input
                                classNames={{input: `text-center ${repsTextColor}`, description: "text-center"}}
                                id={`exercise-${exerciseIndex}-set-${setIndex}-minutes`}
                                inputMode="decimal"
                                variant="bordered"
                                size="sm"
                                aria-label="minutes"
                                color="primary"
                                value={durationMinutes}
                                description={undefined}
                                onValueChange={(value) => {
                                    handleInputChange({
                                        value,
                                        regex: DURATION_MINUTES_REGEX,
                                        isInteger: true,
                                        minValue: DURATION_MINUTES_MIN,
                                        maxValue: DURATION_MINUTES_MAX,
                                        setter: setDurationMinutes,
                                    });
                                }}
                                onBlur={handleBlur}
                            />
                            <span>:</span>
                            <Input
                                classNames={{input: `text-center ${repsTextColor}`, description: "text-center"}}
                                id={`exercise-${exerciseIndex}-set-${setIndex}-seconds`}
                                inputMode="decimal"
                                variant="bordered"
                                size="sm"
                                aria-label="seconds"
                                color="primary"
                                value={durationSeconds}
                                description={undefined}
                                onValueChange={(value) => {
                                    handleInputChange({
                                        value,
                                        regex: DURATION_SECONDS_REGEX,
                                        isInteger: true,
                                        minValue: DURATION_SECONDS_MIN,
                                        maxValue: DURATION_SECONDS_MAX,
                                        setter: setDurationSeconds,
                                    });
                                }}
                                onBlur={handleBlur}
                            />
                        </div>
                }
            </div>
            <div className={exerciseType === "reps" || exerciseType ==="distance" ? "col-span-2" : "col-span-1"}>
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
