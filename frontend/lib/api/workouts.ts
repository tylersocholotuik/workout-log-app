import { Workout } from '@/types';
import { getAuthHeaders } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5258';

export const getWorkouts = async () => {
    const res = await fetch(`${API_URL}/api/workouts`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load workouts");
    }

    const data = await res.json();
    return data;
};

export const getWorkout = async (id: string | string[]) => {
    const res = await fetch(`${API_URL}/api/workouts/${id}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to load workout");
    }

    const data = await res.json();
    return data;
};

export const addWorkout = async (workoutData: Workout) => {
    const res = await fetch(`${API_URL}/api/workouts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add workout");
    }

    const data = await res.json();
    return data;
};

export const updateWorkout = async (id: string | string [] | undefined, workoutData: Workout) => {
    const res = await fetch(`${API_URL}/api/workouts/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update workout");
    }

    const data = await res.json();
    return data;
};

export const deleteWorkout = async (id: string | string[]) => {
    const res = await fetch(`${API_URL}/api/workouts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete workout");
    }
};
