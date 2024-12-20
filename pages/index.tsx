import { useEffect, useState } from "react"
import { useRouter } from "next/router"

import { getWorkout } from "@/utils/api/workouts"
import { Workout } from "@/types"

export default function Home() {
  const [workout, setWorkout] = useState<Workout>()

  const userId = 'cm4uhmfa80000prmoiywcmrlo' // test user
  const workoutId = 1

  useEffect(() => {
    loadWorkout(userId, workoutId)
  }, [])

  const loadWorkout = async (userId: string, workoutId: number) => {
    const data = await getWorkout(userId, workoutId)
    console.log(data)
    setWorkout(data)
  }

  return (
   <>
   </> 
  )
}
