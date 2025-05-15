import { useState } from "react";

import { useWorkoutContext } from "@/pages/workout/[workoutId]";

import { Set } from "@/utils/models/models";

import { Input, Tooltip, Button } from "@heroui/react";
import { DeleteIcon } from "@/icons/DeleteIcon";

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
    const rpeString = set.rpe !== null ? String(set.rpe) : "";

    const [weight, setWeight] = useState(weightString);
    const [reps, setReps] = useState(repsString);
    const [rpe, setRPE] = useState(rpeString);

    const { workout, setWorkout } = useWorkoutContext();

    const handleWeightChange = (value: string) => {
        // let isValid = false;
        // rules for weight:
        // min: 0
        // max: 9999
        // must be in steps of 0.5
        // can be empty string
        // only 1 digital after decimal, must be 0 or 5
        // only 1 decimal
        const regex = /^(\d{0,4})(\.([05]?)?)?$/;

        const isValidFormat = regex.test(value);

        const parsedValue = parseFloat(value);

        const isValidValue =
            !isNaN(parsedValue) &&
            parsedValue >= 0 &&
            parsedValue <= 9999 &&
            parsedValue % 0.5 === 0;

        const isValid = isValidFormat && (value === "" || isValidValue);

        // allow input if isValid, otherwise, input is prevented
        if (isValid) {
            setWeight(value);
        }
    };

    const handleRepsChange = (value: string) => {
        // rules for reps:
        // min: 0
        // max: 9999
        // must be whole number
        // can be empty string
        const regex = /^(?:[0-9]{1,4})?$/;

        const isValidFormat = regex.test(value);

        const parsedValue = parseInt(value);

        const isValidValue =
            !isNaN(parsedValue) && parsedValue >= 0 && parsedValue <= 9999;

        const isValid = isValidFormat && (value === "" || isValidValue);

        if (isValid) {
            setReps(value);
        }
    };

    const handleRPEChange = (value: string) => {
        // rules for RPE:
        // min: 6
        // max: 10
        // steps of 0.5
        // can be empty string
        // only 1 digital after decimal, must be 0 or 5
        // only 1 decimal
        const regex = /^(1$|10|[6-9](\.\d{0,1})?)?$/;

        const isValidFormat = regex.test(value);

        const parsedValue = parseFloat(value);

        let isValidValue = false;

        if (value.length === 1) {
            isValidValue =
                // allows input value of 1 if length is 1 so you can enter 10
                ((parsedValue >= 6 || parsedValue === 1) &&
                    parsedValue % 0.5 === 0) ||
                value === "";
        } else {
            isValidValue =
                (parsedValue >= 6 &&
                    parsedValue <= 10 &&
                    parsedValue % 0.5 === 0) ||
                value === "";
        }

        const isValid = isValidFormat && (value === "" || isValidValue);

        if (isValid) {
            setRPE(value);
        }
    };

    // called on focus blur to remove trailing decimals
    const removeTrailingDecimal = (weight: string, rpe: string) => {
        if (weight.endsWith(".")) {
            weight = weight.slice(0, -1);
            setWeight(weight);
        }
        if (rpe.endsWith(".")) {
            rpe = rpe.slice(0, -1);
            setRPE(rpe);
        }
        if (rpe === "1") {
            // since 1 must be allowed to be entered in order
            // to enter 10, clear the input if user leaves RPE
            // input on 1
            setRPE("");
        }
    };

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
                                        rpe:
                                            rpe !== "" ? parseFloat(rpe) : null,
                                    }
                                  : set
                          ),
                      }
                    : exercise
            ),
        };

        setWorkout(updatedWorkout);
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
                    classNames={{ input: "text-center" }}
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
                    onValueChange={handleWeightChange}
                    onBlur={() => {
                        removeTrailingDecimal(weight, rpe);
                        saveChanges();
                    }}
                />
            </div>
            <div className="col-span-2">
                <Input
                    classNames={{ input: "text-center" }}
                    id={`exercise-${exerciseIndex}-set-${setIndex}-reps`}
                    inputMode="decimal"
                    variant="bordered"
                    size="sm"
                    aria-label="reps"
                    color="primary"
                    value={reps}
                    onValueChange={handleRepsChange}
                    onBlur={() => {
                        removeTrailingDecimal(weight, rpe);
                        saveChanges();
                    }}
                />
            </div>
            <div className="col-span-2">
                <Input
                    classNames={{ input: "text-center" }}
                    id={`exercise-${exerciseIndex}-set-${setIndex}-rpe`}
                    inputMode="decimal"
                    variant="bordered"
                    size="sm"
                    aria-label="rpe"
                    color="primary"
                    value={rpe}
                    onValueChange={handleRPEChange}
                    onBlur={() => {
                        removeTrailingDecimal(weight, rpe);
                        saveChanges();
                    }}
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
                        <DeleteIcon />
                    </Button>
                </Tooltip>
            </div>
        </>
    );
}
