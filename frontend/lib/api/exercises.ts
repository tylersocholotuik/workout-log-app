import {apiFetch, API_URL} from "./client";
import {throwApiError} from "./apiErrors";
import {ExerciseType} from "@/types";

// Get all exercises available to the user (system exercises + their custom exercises)
export const getExercises = async () => {
    const res = await apiFetch(`${API_URL}/api/exercises`);

    if (!res.ok) {
        await throwApiError(res, "Failed to load exercises");
    }

    return await res.json();
};

export const addUserExercise = async (
    name: string,
    exerciseType: ExerciseType
) => {
    const res = await apiFetch(`${API_URL}/api/exercises`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, exerciseType }),
    });

    if (!res.ok) {
        await throwApiError(res, "Failed to add exercise");
    }

    return await res.json();
};

