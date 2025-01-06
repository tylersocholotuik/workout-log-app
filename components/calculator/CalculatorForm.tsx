import { useState, useEffect } from "react";

import { Dispatch, SetStateAction } from "react";

import { Button, Input, Tooltip } from "@nextui-org/react";

import { calculateOneRepMax } from "@/utils/calculator/calc-functions";

import { SetDataType } from "@/pages/calculator";

interface CalculatorFormProps {
    setSetData: Dispatch<SetStateAction<SetDataType>>;
    setOneRepMax: Dispatch<SetStateAction<number>>;
}

export default function CalculatorForm({
    setSetData,
    setOneRepMax,
}: CalculatorFormProps) {
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState("lbs");
    const [reps, setReps] = useState("");
    const [rpe, setRPE] = useState("");

    useEffect(() => {
        updateOneRepMax(weight, reps, rpe);
    }, [weight, reps, rpe, weightUnit]);

    const toggleWeightUnit = () => {
        if (weightUnit === "lbs") {
            setWeightUnit("kg");
        }
        if (weightUnit === "kg") {
            setWeightUnit("lbs");
        }
    };

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
        // min: 1
        // max: 10
        // must be whole number
        // can be empty string
        const regex = /^(10|[1-9])?$/;

        const isValidFormat = regex.test(value);

        const parsedValue = parseInt(value);

        const isValidValue =
            !isNaN(parsedValue) &&
            parsedValue >= 1 &&
            parsedValue <= 10;

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

        console.log(isValidFormat)

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
    }

    const updateOneRepMax = (weight: string, reps: string, rpe: string) => {
        if (
            weight !== "" &&
            reps !== "" &&
            rpe !== "" &&
            parseFloat(rpe) >= 6
        ) {
            const weightNumber = parseFloat(weight);
            const repsNumber = parseInt(reps);
            const rpeNumber = parseFloat(rpe);

            const oneRepMax = calculateOneRepMax(
                weightNumber,
                repsNumber,
                rpeNumber
            );
            const setData = {
                weight: weightNumber,
                weightUnit: weightUnit,
                reps: repsNumber,
                rpe: rpeNumber,
            };

            setOneRepMax(oneRepMax);
            setSetData(setData);
        } else {
            setOneRepMax(0);
        }
    };

    const Clear = () => {
        setWeight("");
        setReps("");
        setWeightUnit("lbs");
        setRPE("");
        setSetData({ weight: "", weightUnit: "lbs", reps: "", rpe: "" });
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
                            }}
                            className="w-[80px]"
                            id="weight"
                            label="Weight"
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            inputMode="decimal"
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">
                                        {weightUnit}
                                    </span>
                                </div>
                            }
                            value={weight}
                            onValueChange={handleWeightChange}
                            onBlur={() => removeTrailingDecimal(weight, rpe)}
                        />
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip content="Weight Unit">
                        <Button
                            aria-label="weight unit"
                            color="default"
                            variant="bordered"
                            size="sm"
                            onPress={toggleWeightUnit}
                        >
                            <span
                                className={
                                    weightUnit === "lbs"
                                        ? "text-primary font-bold"
                                        : ""
                                }
                            >
                                lbs
                            </span>
                            /
                            <span
                                className={
                                    weightUnit === "kg"
                                        ? "text-primary font-bold"
                                        : ""
                                }
                            >
                                kg
                            </span>
                        </Button>
                    </Tooltip>
                </div>
                <div>
                    <Tooltip content="Range: 1-10">
                        <Input
                            classNames={{
                                label: "text-inherit",
                            }}
                            className="w-[60px]"
                            id="reps"
                            label="Reps"
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            inputMode="decimal"
                            value={reps}
                            onValueChange={handleRepsChange}
                            onBlur={() => removeTrailingDecimal(weight, rpe)}
                        />
                    </Tooltip>
                </div>
                <div>
                    <Tooltip
                        content={
                            <div className="px-1 py-2">
                                <div className="text-small font-bold">
                                    Rate of Perceived Exertion
                                </div>
                                <div className="text-tiny">
                                    Range: 6-10, steps of 0.5
                                </div>
                            </div>
                        }
                    >
                        <Input
                            classNames={{
                                label: "text-inherit",
                            }}
                            className="w-[60px]"
                            id="rpe"
                            label="RPE"
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            inputMode="decimal"
                            value={rpe}
                            onValueChange={handleRPEChange}
                            onBlur={() => removeTrailingDecimal(weight, rpe)}
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
