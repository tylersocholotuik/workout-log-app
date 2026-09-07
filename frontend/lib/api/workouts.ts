import {Workout} from '@/types';
import {getAuthHeaders} from "./auth";
import {apiFetch} from "./client";
import {extractErrorMessage} from "./apiErrors";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5258';

export const getWorkouts = async () => {
    const res = await apiFetch(`${API_URL}/api/workouts`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to load workouts"));
    }

    const data = await res.json();
    return data;
};

export const getWorkout = async (id: string | string[]) => {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to load workout"));
    }

    const data = await res.json();
    return data;
};

export const addWorkout = async (workoutData: Workout) => {
    const res = await apiFetch(`${API_URL}/api/workouts`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to add workout"));
    }

    const data = await res.json();
    return data;
};

export const updateWorkout = async (id: string | string [] | undefined, workoutData: Workout) => {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(workoutData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to update workout"));
    }

    const data = await res.json();
    return data;
};

export const deleteWorkout = async (id: string | string[]) => {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to delete workout"));
    }
};
export const getExerciseHistory = async (exerciseId: number | undefined) => {
    const res = await apiFetch(`${API_URL}/api/workouts/exercise-history/${exerciseId}`, {
        headers: getAuthHeaders()
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to fetch exercise history"));
    }

    const data = await res.json();
    return data;
};