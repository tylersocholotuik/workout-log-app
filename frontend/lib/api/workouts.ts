import {Workout} from '@/types';
import {apiFetch} from "./client";
import {extractErrorMessage} from "./apiErrors";

// Nullish coalescing (not ||) so an intentionally empty string in
// staging/production (meaning "same origin, proxied via next.config.ts")
// isn't overridden by the localhost fallback.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5258';

export const getWorkouts = async () => {
    const res = await apiFetch(`${API_URL}/api/workouts`);

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to load workouts"));
    }

    return await res.json();
};

export const getWorkout = async (id: string | string[]) => {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}`);

    // Returns null if the workout belongs to another user, so callers can show
    // an "unauthorized" state instead of a generic error.
    if (res.status === 403) {
        return null;
    }

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to load workout"));
    }

    return await res.json();
};

export const addWorkout = async (workoutData: Workout) => {
    const res = await apiFetch(`${API_URL}/api/workouts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(workoutData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to add workout"));
    }

    return await res.json();
};

export const updateWorkout = async (id: string | string [] | undefined, workoutData: Workout) => {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(workoutData),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to update workout"));
    }

    return await res.json();
};

export const deleteWorkout = async (id: string | string[]) => {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}`, {
        method: "DELETE"
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to delete workout"));
    }
};

export const getExerciseHistory = async (exerciseId: number | undefined) => {
    const res = await apiFetch(`${API_URL}/api/workouts/exercise-history/${exerciseId}`);

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, "Failed to fetch exercise history"));
    }

    return await res.json();
};