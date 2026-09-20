import {apiFetch} from "./client";
import {extractErrorMessage} from "./apiErrors";

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

