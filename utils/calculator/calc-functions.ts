import { rpeData } from "./rpeData";

export const calculateOneRepMax = (weight: number, reps: number, rpe: number) => {
        // formula is Weight x 100 / %1RM
        // sourced from: https://fiftyonestrong.com/rpe/
        return Math.round((weight * 100) / rpeData[rpe][reps]);
    };