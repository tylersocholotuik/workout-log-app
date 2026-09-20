import {apiFetch} from "./client";
import {extractErrorMessage} from "./apiErrors";

// Nullish coalescing (not ||) so an intentionally empty string in
// staging/production (meaning "same origin, proxied via next.config.ts")
// isn't overridden by the localhost fallback.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5258';

// Get all exercises available to the user (system exercises + their custom exercises)
export const getExercises = async () => {
    const res = await apiFetch(`${API_URL}/api/exercises`);

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to load exercises"));
    }

    return await res.json();
};

export const addUserExercise = async (
    name: string
) => {
    const res = await apiFetch(`${API_URL}/api/exercises`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to add exercise"));
    }

    return await res.json();
};

