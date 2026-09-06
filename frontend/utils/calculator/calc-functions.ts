import { rpeData } from "./rpeData";

export const calculateOneRepMax = (
    weight: number,
    reps: number,
    rpe: number
) => {
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
    for (let rpeKey in tableData) {
        for (let repsKey in tableData[rpeKey]) {
            // use manipulated 1RM formula to calculate the weight you can lift
            // at each RPE and reps value
            tableData[rpeKey][repsKey] = Math.round(
                (max * tableData[rpeKey][repsKey]) / 100
            );
        }
    }

    return tableData;
};
