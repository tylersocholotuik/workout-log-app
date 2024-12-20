import { useEffect, useState } from "react"
import { useRouter } from "next/router"

import { addUserExercise, updateUserExercise, deleteUserExercise } from "@/utils/api/exercises"
import { addWorkout } from "@/utils/api/workouts";
import { Workout } from "@/utils/models/models";

import { workoutData } from "@/prisma/data/workoutData2";

export default function Home() {
  const [exerciseName, setExerciseName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const userId = 'cm4uhmfa80000prmoiywcmrlo' // test user
  const workoutId = 1
  const exerciseId = 2

  useEffect(() => {
    addNewWorkout(userId, workoutData)
  }, [])

  const addNewExercise = async (userId: string, name: string) => {
    setError(null);
    try {
      const data = await addUserExercise(userId, name);
      console.log(data)
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message)
      }
    }
  }

  const updateExercise = async (userId: string, exerciseId: number, name: string) => {
    setError(null);
    try {
      const data = await updateUserExercise(userId, exerciseId, name);
      console.log(data)
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message)
      }
    }
  }

  const deleteExercise = async (userId: string, exerciseId: number) => {
    setError(null);
    try {
      const data = await deleteUserExercise(userId, exerciseId);
      console.log(data)
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message)
      }
    }
  }

  const addNewWorkout = async (userId: string, workoutData: Workout) => {
    setError(null);
    try {
      const data = await addWorkout(userId, workoutData);
      console.log(data)
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setError(error.message)
      }
    }
  }

  const handleAddExercise = async () => {
    addNewExercise(userId, exerciseName);
  }

  const handleUpdateExercise = async () => {
    updateExercise(userId, exerciseId, exerciseName)
  }

  const handleDeleteExercise = async () => {
    deleteExercise(userId, exerciseId)
  }

  return (
   <>
    <input 
      type="text" 
      id="exercise" 
      value={exerciseName} 
      onChange={(e) => {
        setExerciseName(e.target.value)
      }}
    />
    <button onClick={handleAddExercise}>Add</button>
    <button onClick={handleUpdateExercise}>Update</button>
    <button onClick={handleDeleteExercise}>Delete</button>
    {error && <p style={{color: 'red'}}>{error}</p>}
   </> 
  )
}
