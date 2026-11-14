import { WeightUnit, DistanceUnit, EffortRatingType, Theme } from "@/types";

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    isAdmin: boolean;
}

export interface UserSettings {
    theme: Theme;
    weightUnit: WeightUnit;
    distanceUnit: DistanceUnit;
    effortType: EffortRatingType;
    showOneRepMax: boolean;
}

export interface PatchUser {
    email?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string | null;
}