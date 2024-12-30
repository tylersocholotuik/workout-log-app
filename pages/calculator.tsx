import { useState } from "react";

import CalculatorForm from "@/components/calculator/CalculatorForm";

export default function Calculator() {
    const [setData, setSetData] = useState({});
    const [oneRepMax, setOneRepMax] = useState(null);
    const [rpeTableData, setRPETableData] = useState({});

    return (
        <div className="container mx-auto px-2 md:px-4 py-6">
            <section>
                <h2 className="text-xl text-center mb-6">
                    One-Rep Max Calculator
                </h2>
                <CalculatorForm
                    setSetData={setSetData}
                    setOneRepMax={setOneRepMax}
                    setRPETableData={setRPETableData}
                />
                <div className="text-center">
                    <p className="text-lg mb-2">
                        Estimated One-Rep Max:
                    </p>
                    {oneRepMax ? 
                        <p>
                            {oneRepMax} {setData.weightUnit}
                        </p> 
                        : 
                        <p className="italic text-default-500">
                            enter values above to calculate
                        </p>
                    }
                </div>
            </section>
        </div>
    );
}
