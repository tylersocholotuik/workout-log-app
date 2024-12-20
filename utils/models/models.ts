export class User {
    id?: string
    email: string = ''
    firstName: string = ''
    lastName: string = ''
    workouts: Workout[] = []
    userExercises: UserExercise[] = []
  } 
  
  export class Exercise {
    id?: number
    name: string = ''
    workoutExercises: WorkoutExercise[] = []
  }
  
  export class UserExercise  {
    id?: number
    name: string = ''
    userId?: string
    user: User = new User()
    workoutExercises: WorkoutExercise[] = []
    deleted: boolean = false
  }
  
  export class Workout {
    id?: number
    title: string = ''
    notes?: string
    date: Date = new Date()
    userId?: string
    exercises: WorkoutExercise[] = [] 
    deleted: boolean = false
  } 
  
  export class WorkoutExercise {
    id?: number
    notes?: string
    weightUnit: WeightUnit = 'lbs'
    exerciseId?: number
    userExerciseId?: number
    workoutId?: number
    exercise?: Exercise | null = null
    userExercise?: UserExercise | null = null
    workout?: Workout = new Workout()
    sets: Set[] = [] 
    deleted: boolean = false
  }
  
  export class Set {
    id?: number
    weight: number | null = null
    reps: number | null = null
    rpe: number | null = null
    exerciseId?: number
    exercise?: WorkoutExercise = new WorkoutExercise() 
    deleted: boolean = false
  }
  
  type WeightUnit = 'lbs' | 'kg'