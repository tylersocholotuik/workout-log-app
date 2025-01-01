import { useState, useEffect } from "react";

import { Dispatch, SetStateAction } from "react";

import { Button, Input, Select, SelectItem, Tooltip } from "@nextui-org/react";

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

    const rpeValues = ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];

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
        const parsedValue = parseFloat(value);

        let isValid = false;
        // rules for weight:
        // min: 0
        // max: 9999
        // must be in steps of 0.5
        isValid =
            (parsedValue >= 0 &&
                parsedValue <= 9999 &&
                parsedValue % 0.5 === 0) ||
            value === "";

        // allow input if isValid, otherwise, input is prevented
        if (isValid) {
            setWeight(value);
        }
    };

    const handleRepsChange = (value: string) => {
        const parsedValue = parseFloat(value);

        let isValid = false;
        // rules for reps:
        // min: 1
        // max: 10
        // must be whole number
        isValid =
            (parsedValue >= 1 &&
                parsedValue <= 10 &&
                Number.isInteger(parsedValue)) ||
            value === "";

        if (isValid) {
            setReps(value);
        }
    };

    const handleRPEChange = (value: string) => {
        const parsedValue = parseFloat(value);

        let isValid = false;
        // rules for RPE:
        // min: 6
        // max: 10
        // steps of 0.5
        if (value.length === 1) {
            isValid =
                // allows input value of 1 if length is 1 so you can enter 10
                ((parsedValue >= 6 || parsedValue === 1) &&
                    parsedValue % 0.5 === 0) ||
                value === "";
        } else {
            isValid =
                (parsedValue >= 6 &&
                    parsedValue <= 10 &&
                    parsedValue % 0.5 === 0) ||
                value === "";
        }

        if (isValid) {
            setRPE(value);
        }
    };

    const updateOneRepMax = (weight: string, reps: string, rpe: string) => {
        if (weight !== "" && reps !== "" && rpe !== "") {
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
                                label: "text-inherit"
                            }}
                            className="w-[80px]"
                            id="weight"
                            label="Weight"
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            type="number"
                            min={0}
                            max={9999}
                            step={0.5}
                            endContent={
                                <div className="pointer-events-none flex items-center">
                                    <span className="text-default-400 text-small">
                                        {weightUnit}
                                    </span>
                                </div>
                            }
                            value={weight}
                            onValueChange={handleWeightChange}
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
                                label: "text-inherit"
                            }}
                            className="w-[60px]"
                            id="reps"
                            label="Reps"
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            type="number"
                            min={1}
                            max={10}
                            step={1}
                            value={reps}
                            onValueChange={handleRepsChange}
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
                                label: "text-inherit"
                            }}
                            className="w-[60px]"
                            id="rpe"
                            label="RPE"
                            labelPlacement="outside"
                            variant="bordered"
                            size="sm"
                            color="primary"
                            type="number"
                            min={6}
                            max={10}
                            step={0.5}
                            value={rpe}
                            onValueChange={handleRPEChange}
                        />
                    </Tooltip>
                </div>
            </div>
            <div className="justify-self-center">
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
