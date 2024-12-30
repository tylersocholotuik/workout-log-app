import { useState, useEffect } from "react";

import { Button, Input, Select, SelectItem, Tooltip } from "@nextui-org/react";

import { calculateOneRepMax } from "@/utils/calculator/calc-functions";

export default function CalculatorForm({
    setSetData,
    setOneRepMax,
    setRPETableData,
}) {
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState("lbs");
    const [reps, setReps] = useState<string>("");
    const [rpe, setRPE] = useState(new Set([]));

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

    const updateOneRepMax = (weight: string, reps: string, rpe) => {
        const rpeString = rpe.currentKey;
        let weightNumber;
        let repsNumber;
        let rpeNumber;

        if (weight !== "" && reps !== "" && rpe.size > 0) {
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

    return (
        <div className="flex flex-row justify-center items-end gap-4 mb-6">
            <div>
                <Input
                    className="w-[90px]"
                    id="weight"
                    label="Weight"
                    labelPlacement="outside"
                    variant="bordered"
                    size="sm"
                    type="number"
                    endContent={
                        <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">
                                {weightUnit}
                            </span>
                        </div>
                    }
                    value={weight}
                    onValueChange={setWeight}
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
                            weightUnit === "lbs" ? "text-primary font-bold" : ""
                        }
                    >
                        lbs
                    </span>
                    /
                    <span
                        className={
                            weightUnit === "kg" ? "text-primary font-bold" : ""
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
                    value={reps}
                    onValueChange={setReps}
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
    );
}
