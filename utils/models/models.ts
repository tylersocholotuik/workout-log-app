export class User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  workouts?: Workout[];
  userExercises?: UserExercise[];
}

export class Exercise {
  id?: number;
  name?: string;
  workoutExercises?: WorkoutExercise[];
}

export class UserExercise {
  id?: number;
  name?: string;
  userId?: string;
  workoutExercises?: WorkoutExercise[];
  deleted?: boolean;
}

export class Workout {
  id?: number;
  title?: string;
  notes?: string;
  date?: Date;
  userId?: string;
  exercises?: WorkoutExercise[];
  deleted?: boolean;
}

export class WorkoutExercise {
  id?: number;
  notes?: string;
  weightUnit?: WeightUnit;
  exerciseId?: number;
  userExerciseId?: number;
  exercise?: Exercise;
  userExercise?: UserExercise;
  workoutId?: number;
  sets?: Set[];
  deleted?: boolean;
}

export class Set {
  id?: number;
  weight?: number;
  reps?: number;
  rpe?: number;
  exerciseId?: number;
  deleted?: boolean;
}

type WeightUnit = "lbs" | "kg";
