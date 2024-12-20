export const getStockExercises = async () => {
    try {
        const res = await fetch(`/api/exercises`)
        if (!res.ok) {
            throw new Error('Failed to fetch exercises')
        }
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error fetching exercises: ', error)
    }
}

export const getUserExercises = async (userId: string) => {
    try {
        const res = await fetch(`/api/${userId}/exercises`)
        if (!res.ok) {
            throw new Error('Failed to fetch exercises')
        }
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error fetching exercises: ', error)
    }
}