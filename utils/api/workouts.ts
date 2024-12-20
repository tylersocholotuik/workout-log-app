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