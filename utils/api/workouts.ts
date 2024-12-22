import { Workout } from "../models/models";

export const getWorkouts = async (userId: string) => {
    const res = await fetch(`/api/${userId}/workouts`)

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load workouts');
    }

    const data = await res.json()
    return data
}

export const getWorkout = async (userId: string, workoutId: number) => {
    const res = await fetch(`/api/${userId}/workouts/${workoutId}`)

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load workout');
    }

    const data = await res.json()
    return data
}

export const addWorkout = async (userId: string, workoutData: Workout) => {
    const res = await fetch(`/api/${userId}/workouts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, workoutData }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add workout');
    }
    
    const data = await res.json();
    return data;
}

export const updateWorkout = async (userId: string, workoutData: Workout) => {
    const res = await fetch(`/api/${userId}/workouts`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            workoutData 
        }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update workout');
    }
    
    const data = await res.json();
    return data;
}