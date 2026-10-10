import {Workout} from '@/types';
import {apiFetch} from "./client";
import {throwApiError} from "./apiErrors";

// NEXT_PUBLIC_API_URL should be left unset in Vercel (staging/production) so
// requests are made relative to the frontend's own origin and proxied to the
// backend via the rewrite in next.config.ts (see BuildAuthCookieOptions in
// JwtService.cs for why). It's only needed locally, where the frontend calls
// the backend directly - Vercel doesn't support saving an empty-string env
// var (it just discards it), so the "same-origin" default only applies when
// NODE_ENV is "production" (true for both Vercel environments), not merely
// when the variable is unset.
const API_URL = process.env.NEXT_PUBLIC_API_URL
    ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5258');

export const getWorkouts = async () => {
    const res = await apiFetch(`${API_URL}/api/workouts`);

    if (!res.ok) {
        await throwApiError(res, "Failed to load workouts");
    }

    return await res.json();
};

export const getWorkout = async (id: string | string[]) => {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}`);

    if (!res.ok) {
        await throwApiError(res, "Failed to load workout");
    }

    return await res.json();
};

export const getActiveWorkout = async () => {
    const res = await apiFetch(`${API_URL}/api/workouts/active`);
    
    if (res.status === 204) {
        return null; // No active workout
    }
    
    if (!res.ok) {
        await throwApiError(res, "Failed to load active workout");
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
        await throwApiError(res, "Failed to add workout");
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
        await throwApiError(res, "Failed to update workout");
    }

    return await res.json();
};

export const finishWorkout = async (id: string)=> {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}/finish`, {
        method: "PATCH",
    });
    
    if (!res.ok) {
        await throwApiError(res, "Failed to finish workout");
    }
};

export const deleteWorkout = async (id: string | string[]) => {
    const res = await apiFetch(`${API_URL}/api/workouts/${id}`, {
        method: "DELETE"
    });

    if (!res.ok) {
        await throwApiError(res, "Failed to delete workout");
    }
};

export const getExerciseHistory = async (exerciseId: number | undefined) => {
    const res = await apiFetch(`${API_URL}/api/workouts/exercise-history/${exerciseId}`);

    if (!res.ok) {
        await throwApiError(res, "Failed to fetch exercise history");
    }

    return await res.json();
};