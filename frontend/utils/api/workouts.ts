import { Workout } from "../models/models";
import { getAuthHeaders } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5258';

export const getWorkouts = async (userId: string | string[] | undefined) => {
    const res = await fetch(`${API_URL}/api/${userId}/workouts`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load workouts");
    }

    const data = await res.json();
    return data;
};

export const getWorkout = async (userId: string | string[] | undefined, id: string | string[]) => {
    const res = await fetch(`${API_URL}/api/${userId}/workouts/${id}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load workout");
    }

    const data = await res.json();
    return data;
};

export const addWorkout = async (userId: string | string[] | undefined, workoutData: Workout) => {
    const res = await fetch(`${API_URL}/api/${userId}/workouts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, workoutData }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add workout");
    }

    const data = await res.json();
    return data;
};

export const updateWorkout = async (userId: string | string[] | undefined, workoutData: Workout) => {
    const res = await fetch(`${API_URL}/api/${userId}/workouts`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            workoutData,
        }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update workout");
    }

    const data = await res.json();
    return data;
};

export const deleteWorkout = async (userId: string | string[] | undefined, id: string | string[]) => {
    const res = await fetch(`${API_URL}/api/${userId}/workouts`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            id,
        }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete workout");
    }

    const data = await res.json();
    return data;
};
