export class Exercise {
    id: number;
    name: string;
    workoutExercises: WorkoutExercise[] | null;

    constructor(
        id: number = 0,
        name: string = "",
        workoutExercises: WorkoutExercise[] | null = null
    ) {
        this.id = id;
        this.name = name;
        this.workoutExercises = workoutExercises;
    }
}

export class UserExercise {
    id: number;
    name: string;
    userId: string;
    workoutExercises: WorkoutExercise[] | null;
    deleted: boolean;

    constructor(
        id: number = 0,
        name: string = "",
        userId: string = "",
        workoutExercises: WorkoutExercise[] | null = null,
        deleted: boolean = false
    ) {
        this.id = id;
        this.name = name;
        this.userId = userId;
        this.workoutExercises = workoutExercises;
        this.deleted = deleted;
    }
}

export class Workout {
    id: number;
    title: string;
    notes: string | null;
    date: Date;
    userId: string;
    exercises: WorkoutExercise[];
    deleted: boolean;

    constructor(
        id: number = 0,
        title: string = `${new Date().toLocaleString("en-CA", {
            dateStyle: "short",
        })} Workout`,
        notes: string | null = "",
        date: Date = new Date(),
        userId: string = "",
        exercises: WorkoutExercise[] = [],
        deleted: boolean = false
    ) {
        this.id = id;
        this.title = title;
        this.notes = notes;
        this.date = date;
        this.userId = userId;
        this.exercises = exercises;
        this.deleted = deleted;
    }
}

export class WorkoutExercise {
    id: number;
    notes: string | null;
    weightUnit: WeightUnit;
    exerciseId: number | null;
    userExerciseId: number | null;
    exercise: Exercise | null;
    userExercise: UserExercise | null;
    workoutId: number;
    sets: Set[];
    deleted: boolean;

    constructor(
        id: number = 0,
        notes: string | null = "",
        weightUnit: WeightUnit = "lbs",
        exerciseId: number | null = null,
        userExerciseId: number | null = null,
        exercise: Exercise | null = null,
        userExercise: UserExercise | null = null,
        workoutId: number = 0,
        sets: Set[] = [],
        deleted: boolean = false
    ) {
        this.id = id;
        this.notes = notes;
        this.weightUnit = weightUnit;
        this.exerciseId = exerciseId;
        this.userExerciseId = userExerciseId;
        this.exercise = exercise;
        this.userExercise = userExercise;
        this.workoutId = workoutId;
        this.sets = sets;
        this.deleted = deleted;
    }
}

export class Set {
    id: number;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    exerciseId: number;
    deleted: boolean;

    constructor(
        id: number = 0,
        weight: number | null = null,
        reps: number | null = null,
        rpe: number | null = null,
        exerciseId: number = 0,
        deleted: boolean = false
    ) {
        this.id = id;
        this.weight = weight;
        this.reps = reps;
        this.rpe = rpe;
        this.exerciseId = exerciseId;
        this.deleted = deleted;
    }
}

export type WeightUnit = "lbs" | "kg";
