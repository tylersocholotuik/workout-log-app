export class User {
    id: string = ''
    email: string = ''
    firstName: string = ''
    lastName: string = ''
    workouts: Workout[] = []
    userExercises: UserExercise[] = []
  } 
  
  export class Exercise {
    id: number = 0
    name: string = ''
    workoutExercises: WorkoutExercise[] = []
  }
  
  export class UserExercise  {
    id: number = 0
    name: string = ''
    userId: string = ''
    user: User = new User()
    workoutExercises: WorkoutExercise[] = []
    deleted: boolean = false
  }
  
  export class Workout {
    id: number = 0
    title: string = ''
    notes: string | null = null
    date: Date = new Date()
    userId: string = ''
    exercises: WorkoutExercise[] = [] 
    deleted: boolean = false
  } 
  
  export class WorkoutExercise {
    id: number = 0
    notes?: string
    weightUnit: WeightUnit = 'lbs'
    exerciseId: number = 0
    userExerciseId: number = 0
    workoutId: number = 0
    exercise: Exercise | null = null
    userExercise: UserExercise | null = null
    workout: Workout = new Workout()
    sets: Set[] = [] 
    deleted: boolean = false
  }
  
  export class Set {
    id: number = 0
    weight: number | null = null
    reps: number | null = null
    rpe: number | null = null
    exerciseId: number = 0
    exercise: WorkoutExercise = new WorkoutExercise() 
    deleted: boolean = false
  }
  
  type WeightUnit = 'lbs' | 'kg'