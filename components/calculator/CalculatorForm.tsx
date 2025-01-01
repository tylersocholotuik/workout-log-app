import { useState, useEffect } from "react";

import { Dispatch, SetStateAction } from "react";

import { Button, Input, Select, SelectItem } from "@nextui-org/react";

import { calculateOneRepMax } from "@/utils/calculator/calc-functions";

interface CalculatorFormProps {
    setSetData: Dispatch<
        SetStateAction<{
            weight: number;
            weightUnit: string;
            reps: number;
            rpe: number;
        }>
    >;
    setOneRepMax: Dispatch<SetStateAction<number>>;
}

export default function CalculatorForm({
    setSetData,
    setOneRepMax,
}: CalculatorFormProps) {
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState("lbs");
    const [reps, setReps] = useState<string>("");
    const [rpe, setRPE] = useState(new Set([""]));

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

    const updateOneRepMax = (weight: string, reps: string, rpe: Set<string>) => {
        const rpeString = rpe.currentKey;
        let weightNumber;
        let repsNumber;
        let rpeNumber;

        if (weight !== "" && reps !== "" && rpeString !== undefined) {
            weightNumber = parseFloat(weight);
            repsNumber = parseInt(reps);
            rpeNumber = parseFloat(rpeString);

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
        setRPE(new Set([""]));
        setSetData({});
        setOneRepMax(0);
    };

    return (
        <div>
            <div className="flex flex-row justify-center items-end gap-2 mb-2">
                <div>
                    <Input
                        className="w-[80px]"
                        id="weight"
                        label="Weight"
                        labelPlacement="outside"
                        variant="bordered"
                        size="sm"
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
                </div>
                <div className="">
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
                </div>
                <div>
                    <Input
                        className="w-[60px]"
                        id="reps"
                        label="Reps"
                        labelPlacement="outside"
                        variant="bordered"
                        size="sm"
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={reps}
                        onValueChange={handleRepsChange}
                    />
                </div>
                <div>
                    <Select
                        className="w-[80px]"
                        id="rpe"
                        label="RPE"
                        labelPlacement="outside"
                        variant="bordered"
                        size="sm"
                        selectedKeys={rpe}
                        onSelectionChange={setRPE}
                    >
                        {rpeValues.map((value) => (
                            <SelectItem key={value}>{value}</SelectItem>
                        ))}
                    </Select>
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
