import {getAuthHeaders} from "./auth";
import {apiFetch} from "./client";
import {extractErrorMessage} from "./apiErrors";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5258';

// Get all exercises available to the user (system exercises + their custom exercises)
export const getExercises = async () => {
    const res = await apiFetch(`${API_URL}/api/exercises`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to load exercises"));
    }

    const data = await res.json();
    return data;
};

export const addUserExercise = async (
    name: string
) => {
    const res = await apiFetch(`${API_URL}/api/exercises`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to add exercise"));
    }

    const data = await res.json();
    return data;
};

export const updateUserExercise = async (
    userId: string | string[] | undefined,
    exerciseId: number,
    newName: string
) => {
    const res = await apiFetch(`${API_URL}/api/${userId}/exercises`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            userId: userId,
            exerciseId: exerciseId,
            newName: newName,
        }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to update exercise"));
    }

    const data = await res.json();
    return data;
};

export const deleteUserExercise = async (
    userId: string | string[] | undefined,
    exerciseId: number
) => {
    const res = await apiFetch(`${API_URL}/api/${userId}/exercises`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            exerciseId: exerciseId,
        }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to delete exercise"));
    }

    const data = await res.json();
    return data;
};

