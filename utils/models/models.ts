export class Exercise {
    id: number;
    name: string;
    userId?: string | null;
    deleted?: boolean;
    workoutExercises?: WorkoutExercise[] | null;

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

export class Workout {
    id: string;
    title: string;
    notes: string;
    date: Date;
    userId: string;
    exercises: WorkoutExercise[];
    deleted: boolean;

    constructor(
        id: string = "",
        title: string = `${new Date().toLocaleString("en-CA", {
            dateStyle: "short",
        })} Workout`,
        notes: string = "",
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
    notes: string;
    weightUnit: WeightUnit;
    exerciseId: number | null;
    userExerciseId: number | null;
    exercise: Exercise | null;
    workoutId: string;
    sets: Set[];
    deleted: boolean;

    constructor(
        id: number = 0,
        notes: string = "",
        weightUnit: WeightUnit = "lbs",
        exerciseId: number | null = null,
        userExerciseId: number | null = null,
        exercise: Exercise | null = null,
        workoutId: string = "",
        sets: Set[] = [],
        deleted: boolean = false
    ) {
        this.id = id;
        this.notes = notes;
        this.weightUnit = weightUnit;
        this.exerciseId = exerciseId;
        this.userExerciseId = userExerciseId;
        this.exercise = exercise;
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

// view model for the ExerciseHistoryModal component
export type ExerciseHistory = {
    notes: string;
    weightUnit: WeightUnit;
    workout: {
        date: string;
    };
    sets: [
        {
            weight: number;
            reps: number;
            rpe: number;
        }
    ];
};
