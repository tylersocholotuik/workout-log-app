import { useEffect, useState } from "react"
import { useRouter } from "next/router"

import { getWorkout } from "@/utils/api/workouts"
import { getStockExercises, getUserExercises } from "@/utils/api/exercises"
import { Exercise, UserExercise, Workout } from "@/types"

export default function Home() {
  const [workout, setWorkout] = useState<Workout>(null)
  const [stockExercises, setStockExercises] = useState<Exercise>(null)
  const [userExercises, setUserExercises] = useState<UserExercise>(null)

  const userId = 'cm4uhmfa80000prmoiywcmrlo' // test user
  const workoutId = 1

  useEffect(() => {
    loadWorkout(userId, workoutId)
    loadStockExercises()
    loadUserExercises(userId)
  }, [])

  const loadWorkout = async (userId: string, workoutId: number) => {
    const data = await getWorkout(userId, workoutId)
    console.log(data)
    setWorkout(data)
  }

  const loadStockExercises = async () => {
    const data = await getStockExercises()
    console.log(data)
    setStockExercises(data)
  }

  const loadUserExercises = async (userId: string) => {
    const data = await getUserExercises(userId)
    console.log(data)
    setUserExercises(data)
  }

  return (
   <>
   </> 
  )
}
