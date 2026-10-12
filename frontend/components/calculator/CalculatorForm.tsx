import { useState, useEffect, useCallback } from "react";

import { Dispatch, SetStateAction } from "react";

import { Button, Input, Tooltip } from "@heroui/react";

import { calculateOneRepMax, convertEffortRating } from "@/utils/calculator/calculator";
import { handleInputChange, sanitizeDisplayValues } from "@/utils/inputHandlers";

import { SetDataType } from "@/pages/calculator";
import { EffortRatingType, WeightUnit} from "@/types";

interface CalculatorFormProps {
    setSetData: Dispatch<SetStateAction<SetDataType>>;
    setOneRepMax: Dispatch<SetStateAction<number>>;
    effortType: EffortRatingType;
    setEffortType: Dispatch<SetStateAction<EffortRatingType>>;
}

export default function CalculatorForm({
    setSetData,
    setOneRepMax,
    effortType,
    setEffortType,
}: CalculatorFormProps) {
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState<WeightUnit>("lbs");
    const [reps, setReps] = useState("");
    const [effortRating, setEffortRating] = useState("");

    // Rules for weight:
    //  min: 0, max: 9999, steps of 0.5, can be empty string, only 1 digit after decimal (0 or 5), only 1 decimal
    const WEIGHT_REGEX = /^(\d{0,4})(\.([05]?)?)?$/;
    // Rules for reps:
    //  min: 1, max: 10, must be an integer, can be empty string
    const REPS_REGEX = /^(10|[1-9])?$/;
    // Rules for RPE: min: 6, max: 10, steps of 0.5, can be empty string
    const RPE_REGEX = /^(\d{0,2})(\.([05]?)?)?$/;
    const RPE_MIN = 6;
    const RPE_MAX = 10;
    // Rules for RIR: min: 0, max: 4, must be an integer, can be empty string
    const RIR_REGEX = /^[0-4]?$/;
    const RIR_MIN = 0;
    const RIR_MAX = 4;
    
    const effortRatingRegex = effortType === "rpe" ? RPE_REGEX : RIR_REGEX;
    const effortRatingMin = effortType === "rpe" ? RPE_MIN : RIR_MIN;
    const effortRatingMax = effortType === "rpe" ? RPE_MAX : RIR_MAX;

    const updateOneRepMax = useCallback(
        (weight: string, reps: string, effortRating: string) => {
            const effortRatingNumber = parseFloat(effortRating);
            let isValidEffortRating = true;
            
            // Handles the case where RPE is entered as 1 to allow the user to enter 10, 
            // but does not allow 1 to be used in the calculation.
            if (effortType === "rpe" && effortRatingNumber < RPE_MIN) {
                isValidEffortRating = false;
            }
            
            if (
                weight !== "" &&
                reps !== "" &&
                effortRating !== "" &&
                isValidEffortRating
            ) {
                const weightNumber = parseFloat(weight);
                const repsNumber = parseInt(reps);
                const effortRatingNumber = parseFloat(effortRating);

                const oneRepMax = calculateOneRepMax({
                    weight: weightNumber,
                    reps: repsNumber,
                    effortType: effortType,
                    effortRating: effortRatingNumber
                });
                const setData = {
                    weight: weightNumber,
                    weightUnit: weightUnit,
                    reps: repsNumber,
                    effortRating: effortRatingNumber,
                };

                setOneRepMax(oneRepMax);
                setSetData(setData);
            } else {
                setOneRepMax(0);
            }
        },
        [weightUnit, effortType, setOneRepMax, setSetData]
    );
    
    useEffect(() => {
        updateOneRepMax(weight, reps, effortRating);
    }, [weight, reps, effortRating, weightUnit, updateOneRepMax]);

    const toggleWeightUnit = () => {
        const newWeightUnit = weightUnit === "lbs" ? "kg" : "lbs";
        setWeightUnit(newWeightUnit);
    };
    
    const toggleEffortType = () => {
        const newEffortType = effortType === "rpe" ? "rir" : "rpe";

        setEffortType(newEffortType);

        if (effortRating !== "") {
            setEffortRating(convertEffortRating(parseFloat(effortRating)).toString());
        }
    };



    // called on focus blur to clean up display formatting
    const handleBlur = () => {
        sanitizeDisplayValues([
            { value: weight, setter: setWeight, stripTrailingDecimal: true, stripLeadingZero: true },
            { value: effortRating, setter: setEffortRating, stripTrailingDecimal: true },
        ]);

        if (effortRating === "1") {
            // since 1 must be allowed to be entered in order
            // to enter 10, clear the input if user leaves RPE
            // input on 1
            setEffortRating("");
        }
    };

    const Clear = () => {
        setWeight("");
        setReps("");
        setWeightUnit("lbs");
        setEffortRating("");
        setEffortType("rpe");
        setSetData({ weight: "", weightUnit: "lbs", reps: "", effortRating: "" });
        setOneRepMax(0);
    };

    return (
        <div>
            <div className="flex flex-row justify-center items-end gap-2 mb-2">
                <div>
                    <Tooltip content="Range: 0-9999">
                        <Input
                            classNames={{
                                label: "text-inherit",
                                input: "min-w-0",
                            }}
                            className="w-[125px]"
                            id="weight"
                            label="Weight"
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            inputMode="decimal"
                            endContent={
                                <Button
                                    aria-label="weight unit"
                                    className="h-7 min-w-0 shrink-0 gap-0.5 px-1 text-tiny"
                                    color="default"
                                    variant="light"
                                    size="sm"
                                    onPress={toggleWeightUnit}
                                >
                                    <span
                                        className={
                                            weightUnit === "lbs"
                                                ? "text-primary font-bold"
                                                : "text-default-400"
                                        }
                                    >
                                        lbs
                                    </span>
                                    <span className="text-default-400">/</span>
                                    <span
                                        className={
                                            weightUnit === "kg"
                                                ? "text-primary font-bold"
                                                : "text-default-400"
                                        }
                                    >
                                        kg
                                    </span>
                                </Button>
                            }
                            value={weight}
                            onValueChange={(value) =>
                                handleInputChange({
                                    value,
                                    regex: WEIGHT_REGEX,
                                    isInteger: false,
                                    minValue: 0,
                                    maxValue: 9999,
                                    setter: setWeight,
                                })
                            }
                            onBlur={handleBlur}
                        />
                    </Tooltip>
                </div>
                <div>
                    <Tooltip content="Range: 1-10">
                        <Input
                            classNames={{
                                label: "text-inherit",
                            }}
                            className="w-[70px]"
                            id="reps"
                            label="Reps"
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            inputMode="decimal"
                            value={reps}
                            onValueChange={(value) =>
                                handleInputChange({
                                    value,
                                    regex: REPS_REGEX,
                                    isInteger: true,
                                    minValue: 1,
                                    maxValue: 10,
                                    setter: setReps,
                                })
                            }
                            onBlur={handleBlur}
                        />
                    </Tooltip>
                </div>
                <div>
                    <Tooltip
                        content={
                            <div className="px-1 py-2">
                                <div className="text-small font-bold">
                                    {effortType === "rpe" ? 
                                        "Rate of Perceived Exertion" : "Reps in Reserve"}
                                </div>
                                <div className="text-tiny">
                                    {effortType === "rpe" ? 
                                        "Range: 6-10, steps of 0.5" : "Range: 0-4"}
                                </div>
                            </div>
                        }
                    >
                        <Input
                            classNames={{
                                label: "text-inherit",
                                input: "min-w-0",
                            }}
                            className="w-[125px]"
                            id="effortRating"
                            label={effortType === "rpe" ? "RPE" : "RIR"}
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            inputMode="decimal"
                            endContent={
                                <Button
                                    aria-label="effort rating type"
                                    className="h-7 min-w-0 shrink-0 gap-0.5 px-1 text-tiny"
                                    color="default"
                                    variant="light"
                                    size="sm"
                                    onPress={toggleEffortType}
                                >
                                    <span
                                        className={
                                            effortType === "rpe"
                                                ? "text-primary font-bold"
                                                : "text-default-400"
                                        }
                                    >
                                        RPE
                                    </span>
                                    <span className="text-default-400">/</span>
                                    <span
                                        className={
                                            effortType === "rir"
                                                ? "text-primary font-bold"
                                                : "text-default-400"
                                        }
                                    >
                                        RIR
                                    </span>
                                </Button>
                            }
                            value={effortRating}
                            onValueChange={(value) =>
                                handleInputChange({
                                    value,
                                    regex: effortRatingRegex,
                                    isInteger: effortType === "rir",
                                    minValue: effortRatingMin,
                                    maxValue: effortRatingMax,
                                    setter: setEffortRating,
                                })
                            }
                            onBlur={handleBlur}
                        />
                    </Tooltip>
                </div>
            </div>
            <div className="flex justify-center">
                <Button
                    color="primary"
                    variant="light"
                    size="md"
                    onPress={Clear}
                >
                    Clear
                </Button>
            </div>
        </div>
    );
}
