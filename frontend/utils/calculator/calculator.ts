import { rpeData } from "./rpeData";
import { EffortRatingType } from "@/types";

// converts RIR to RPE and vice versa
export const convertEffortRating = (value: number) => {
    // Conversion from RPE to RIR needs to be rounded up to the nearest whole number.
    // RIR is always an integer, so Math.ceil will have no effect on RIR to RPE conversion.
    return 10 - Math.ceil(value);
}

export interface CalculateOneRepMaxParams {
    weight: number;
    reps: number;
    effortType: EffortRatingType;
    effortRating: number;
}

export const calculateOneRepMax = ({
    weight,
    reps,
    effortType,
    effortRating,
}: CalculateOneRepMaxParams) => {
    const rpe = effortType === "rpe" ? effortRating : convertEffortRating(effortRating);
    // formula is Weight x 100 / %1RM
    // sourced from: https://fiftyonestrong.com/rpe/
    return Math.round((weight * 100) / rpeData[rpe][reps]);
};

export const generateTableData = (max: number) => {
    // create a deep copy of rpeData to match structure
    const tableData: typeof rpeData = Object.fromEntries(
        Object.entries(rpeData).map(([rpeKey, repsData]) => [
            rpeKey,
            { ...repsData },
        ])
    );

    // iterate through rpe and reps keys and calculate table cell for each value
    for (const rpeKey in tableData) {
        for (const repsKey in tableData[rpeKey]) {
            // use manipulated 1RM formula to calculate the weight you can lift
            // at each RPE and reps value
            tableData[rpeKey][repsKey] = Math.round(
                (max * tableData[rpeKey][repsKey]) / 100
            );
        }
    }

    return tableData;
};
