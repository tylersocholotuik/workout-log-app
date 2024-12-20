export const getWorkouts = async (userId: string) => {
    try {
        const res = await fetch(`/api/${userId}/workouts`)
        if (!res.ok) {
            throw new Error('Failed to fetch workouts')
        }
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error fetching workouts: ', error)
    }
}

export const getWorkout = async (userId: string, workoutId: number) => {
    try {
        const res = await fetch(`/api/${userId}/workouts/${workoutId}`)
        if (!res.ok) {
            throw new Error('Failed to fetch workouts')
        }
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error fetching workouts: ', error)
    }
}

export const testGetWorkout = async () => {
    try {
        const res = await fetch(`/api/test`)
        if (!res.ok) {
            throw new Error('Failed to fetch workouts')
        }
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error fetching workouts: ', error)
    }
}