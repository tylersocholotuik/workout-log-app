import { useState, useEffect } from "react";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Tooltip,
} from "@nextui-org/react";

import CalculatorForm from "@/components/calculator/CalculatorForm";
import RPEDataTable from "@/components/calculator/RPEDataTable";

export interface SetDataType {
    weight: number | string;
    weightUnit: string;
    reps: number | string;
    rpe: number | string;
}

interface CalculatorModalProps {
    isOpen: boolean;
    onOpenChange: () => void;
}

export default function CalculatorModal({
    isOpen,
    onOpenChange,
}: CalculatorModalProps) {
    const [setData, setSetData] = useState<SetDataType>({
        weight: "",
        weightUnit: "lbs",
        reps: "",
        rpe: "",
    });
    const [oneRepMax, setOneRepMax] = useState(0);
    const [conversionWeightUnit, setConversionWeightUnit] = useState("lbs");
    const { weightUnit } = setData;

    useEffect(() => {
        // change the conversion unit to the weight unit whenever weight unit changes
        // so that the conversion calculation is correct for the selected weight unit
        setConversionWeightUnit(weightUnit);
    }, [weightUnit]);

    const convertWeightUnit = () => {
        const LBS_TO_KG = 0.453592;
        const KG_TO_LBS = 2.20462;
        // toggle the weight conversion unit and update state
        const conversionUnit = conversionWeightUnit === "lbs" ? "kg" : "lbs";
        setConversionWeightUnit(conversionUnit);

        // flag to perform unit conversion only when weight unit and conversion
        // unit are not the same
        const doUnitConversion = weightUnit !== conversionUnit;

        let conversionRate = 1;

        if (
            (doUnitConversion && weightUnit === "lbs") ||
            (!doUnitConversion && weightUnit === "kg")
        ) {
            // convert from lbs to kg
            conversionRate = LBS_TO_KG;
        } else if (
            (!doUnitConversion && weightUnit === "lbs") ||
            (doUnitConversion && weightUnit === "kg")
        ) {
            // convert from kg to lbs
            conversionRate = KG_TO_LBS;
        }

        setOneRepMax(Math.round(oneRepMax * conversionRate));
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            scrollBehavior="inside"
            size="full"
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1 text-center">
                            One-Rep Max Calculator
                        </ModalHeader>
                        <ModalBody>
                            <div className="container mx-auto px-2 md:px-4">
                                <RPEDataTable
                                    oneRepMax={oneRepMax}
                                    weightUnit={conversionWeightUnit}
                                />
                                <div>
                                    <div className="text-center mb-6">
                                        <p className="text-md md:text-lg mt-6 mb-2">
                                            Estimated One-Rep Max:
                                        </p>
                                        {oneRepMax > 0 ? (
                                            <>
                                                <p className="font-bold text-lg md:text-xl text-primary mb-4">
                                                    {oneRepMax}{" "}
                                                    {conversionWeightUnit}
                                                </p>
                                                <Tooltip
                                                    content="Toggle weight unit conversion"
                                                    placement="bottom"
                                                >
                                                    <Button
                                                        aria-label="weight unit"
                                                        color="default"
                                                        variant="bordered"
                                                        size="sm"
                                                        onPress={
                                                            convertWeightUnit
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                conversionWeightUnit ===
                                                                "lbs"
                                                                    ? "text-primary font-bold"
                                                                    : ""
                                                            }
                                                        >
                                                            lbs
                                                        </span>
                                                        /
                                                        <span
                                                            className={
                                                                conversionWeightUnit ===
                                                                "kg"
                                                                    ? "text-primary font-bold"
                                                                    : ""
                                                            }
                                                        >
                                                            kg
                                                        </span>
                                                    </Button>
                                                </Tooltip>
                                            </>
                                        ) : (
                                            <p className="text-foreground-500">
                                                Enter values below to calculate
                                            </p>
                                        )}
                                    </div>
                                    <CalculatorForm
                                        setSetData={setSetData}
                                        setOneRepMax={setOneRepMax}
                                    />
                                </div>
                            </div>
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
