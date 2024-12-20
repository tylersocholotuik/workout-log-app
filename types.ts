export type User = {
    id: string
    email: string
    firstName: string
    lastName: string
    workouts: Workout[] 
    userExercises: UserExercise[] 
  } | null
  
  export type Exercise = {
    id: number
    name: string
    workoutExercises: WorkoutExercise[] 
  } | null
  
  export type UserExercise = {
    id: number
    name: string
    userId: string
    user: User 
    workoutExercises: WorkoutExercise[] 
    deleted: boolean
  } | null
  
  export type Workout = {
    id: number
    title: string
    notes: string | null
    date: Date
    userId: string
    exercises: WorkoutExercise[] 
    deleted: boolean
  } | null
  
  export type WorkoutExercise = {
    id: number
    notes: string | null
    weightUnit: string
    exerciseId: number | null
    userExerciseId: number | null
    workoutId: number
    exercise: Exercise | null 
    userExercise: UserExercise | null 
    workout: Workout 
    sets: Set[] 
    deleted: boolean
  } | null
  
  export type Set = {
    id: number
    weight: number | null
    reps: number | null
    rpe: number | null
    exerciseId: number
    exercise: WorkoutExercise 
    deleted: boolean
  } | null
  