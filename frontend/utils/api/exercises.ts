import { getAuthHeaders } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5258';

export const getStockExercises = async () => {
    const res = await fetch(`${API_URL}/api/exercises`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load exercises");
    }

    const data = await res.json();
    return data;
};

export const getUserExercises = async (
    userId: string | string[] | undefined
) => {
    const res = await fetch(`${API_URL}/api/${userId}/exercises`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load exercises");
    }

    const data = await res.json();
    return data;
};

export const addUserExercise = async (
    userId: string | string[] | undefined,
    name: string
) => {
    const res = await fetch(`${API_URL}/api/${userId}/exercises`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, name }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add exercise");
    }

    const data = await res.json();
    return data;
};

export const updateUserExercise = async (
    userId: string | string[] | undefined,
    exerciseId: number,
    newName: string
) => {
    const res = await fetch(`${API_URL}/api/${userId}/exercises`, {
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
        throw new Error(errorData.error || "Failed to update exercise");
    }

    const data = await res.json();
    return data;
};

export const deleteUserExercise = async (
    userId: string | string[] | undefined,
    exerciseId: number
) => {
    const res = await fetch(`${API_URL}/api/${userId}/exercises`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            exerciseId: exerciseId,
        }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete exercise");
    }

    const data = await res.json();
    return data;
};

export const getExerciseHistory = async (
    userId: string | string[] | undefined,
    exerciseId: number | null | undefined,
    userExerciseId: number | null | undefined
) => {
    const queryParams = new URLSearchParams({
        ...(exerciseId && { exerciseId: exerciseId.toString() }),
        ...(userExerciseId && { userExerciseId: userExerciseId.toString() }),
    }).toString();

    const res = await fetch(`${API_URL}/api/${userId}/exercises/exercise-history?${queryParams}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch exercise history");
    }

    const data = await res.json();
    return data;
};

