import { useState, useEffect } from "react";

import { Button } from "@nextui-org/react";

import CalculatorForm from "@/components/calculator/CalculatorForm";
import RPEDataTable from "@/components/calculator/RPEDataTable";

export default function Calculator() {
    const [setData, setSetData] = useState({});
    const [oneRepMax, setOneRepMax] = useState(0);
    const [conversionWeightUnit, setConversionWeightUnit] = useState("lbs");
    const { weightUnit } = setData;

    useEffect(() => {
        // change the conversion unit to the weight unit whenever weight unit changes
        // so that the conversion calculation is correct for the selected weight unit
        setConversionWeightUnit(weightUnit);
    }, [weightUnit]);

    const convertWeightUnit = () => {
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
            // convet from lbs to kg
            conversionRate = 0.453592;
        } else if (
            (!doUnitConversion && weightUnit === "lbs") ||
            (doUnitConversion && weightUnit === "kg")
        ) {
            // convert from kg to lbs
            conversionRate = 2.20462;
        }

        setOneRepMax(Math.round(oneRepMax * conversionRate));
    };

    return (
        <div className="container mx-auto px-2 md:px-4 py-6">
            <section>
                <h2 className="text-xl text-center mb-6">
                    One-Rep Max Calculator
                </h2>
                <CalculatorForm
                    setSetData={setSetData}
                    setOneRepMax={setOneRepMax}
                />
                <div className="text-center mb-6">
                    <p className="text-lg mb-2">Estimated One-Rep Max:</p>
                    {oneRepMax > 0 ? (
                        <>
                            <p className="font-bold text-xl text-primary mb-4">
                                {oneRepMax} {conversionWeightUnit}
                            </p>
                            <Button
                                aria-label="weight unit"
                                color="default"
                                variant="bordered"
                                size="sm"
                                onPress={convertWeightUnit}
                            >
                                <span
                                    className={
                                        conversionWeightUnit === "lbs"
                                            ? "text-primary font-bold"
                                            : ""
                                    }
                                >
                                    lbs
                                </span>
                                /
                                <span
                                    className={
                                        conversionWeightUnit === "kg"
                                            ? "text-primary font-bold"
                                            : ""
                                    }
                                >
                                    kg
                                </span>
                            </Button>
                        </>
                    ) : (
                        <p className="italic text-default-500">
                            enter values above to calculate
                        </p>
                    )}
                </div>
                <RPEDataTable oneRepMax={oneRepMax} />
            </section>
        </div>
    );
}
