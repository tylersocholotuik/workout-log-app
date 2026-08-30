# TypeScript Project Structure Best Practices

## 🤔 Current Structure Issues

**Current location:** `utils/models/models.ts` (137 lines, 14 exports)

**Problems:**
1. ❌ `utils/` is for utility **functions**, not type definitions
2. ❌ `models.ts` implies ORM/class models (ActiveRecord, Mongoose, etc.)
3. ❌ All types in one file works now, but doesn't scale well
4. ❌ Factory functions mixed with type definitions

---

## ✅ Recommended Structure

### **Option 1: Single `types/` folder with domain files** (RECOMMENDED)

```
frontend/
├── types/
│   ├── index.ts          # Re-exports everything
│   ├── workout.ts        # Workout, WorkoutExercise, Set
│   ├── exercise.ts       # Exercise, ExerciseHistory
│   ├── auth.ts           # User, RegisterData, LoginData, AuthResponse
│   └── common.ts         # WeightUnit, shared types
├── lib/
│   ├── factories/
│   │   ├── index.ts      # Re-exports all factories
│   │   ├── workout.ts    # createEmptyWorkout, createEmptyWorkoutExercise, createEmptySet
│   │   └── exercise.ts   # createEmptyExercise
│   └── api/              # Move from utils/api
│       ├── auth.ts
│       ├── exercises.ts
│       └── workouts.ts
├── utils/
│   ├── calculator/       # Keep utility functions here
│   └── ...
```

**Pros:**
- ✅ Clear separation: types vs logic vs utilities
- ✅ Scales well as project grows
- ✅ Easy to find related types
- ✅ Industry standard for Next.js/TypeScript projects
- ✅ `lib/` is common Next.js convention for shared code

**Cons:**
- More files (but better organization)

---

### **Option 2: Single `types.ts` file at root** (SIMPLER)

```
frontend/
├── types.ts              # All interfaces and types
├── lib/
│   ├── factories.ts      # All factory functions
│   └── api/
│       ├── auth.ts
│       ├── exercises.ts
│       └── workouts.ts
├── utils/
│   └── calculator/
```

**Pros:**
- ✅ Simple - everything in one place
- ✅ Easy imports: `import { Workout } from '@/types'`
- ✅ Good for small-to-medium projects

**Cons:**
- ❌ Doesn't scale if types file gets huge (500+ lines)
- ❌ Harder to navigate with many types

---

### **Option 3: Keep current structure but rename** (MINIMAL)

```
frontend/
├── types/
│   └── index.ts          # Rename from models.ts
├── lib/
│   ├── factories.ts      # Factory functions
│   └── api/
│       ├── auth.ts
│       ├── exercises.ts
│       └── workouts.ts
```

**Pros:**
- ✅ Minimal changes
- ✅ Correct naming (`types` not `models`)

**Cons:**
- ❌ Still mixes all domains in one file

---

## 🎯 My Recommendation: **Option 1**

### Why?

1. **Separation of Concerns**
   - Types define **shape**
   - Factories create **instances**
   - API handles **communication**
   - Utils provide **helpers**

2. **Scalability**
   - Easy to add new domains (e.g., `types/user-settings.ts`)
   - Clear where to find types for each feature
   - Can split large files without refactoring imports

3. **Industry Standard**
   - `types/` for TypeScript definitions
   - `lib/` for shared library code
   - `utils/` for utility functions

4. **Better DX**
   ```typescript
   // Clear, semantic imports
   import { Workout, WorkoutExercise } from '@/types/workout';
   import { User } from '@/types/auth';
   import { createEmptyWorkout } from '@/lib/factories/workout';
   import { getWorkouts } from '@/lib/api/workouts';
   ```

---

## 📁 Proposed File Organization

### `types/index.ts` (Re-export for convenience)
```typescript
// Core types
export * from './workout';
export * from './exercise';
export * from './auth';
export * from './common';
```

### `types/workout.ts`
```typescript
import { WeightUnit } from './common';
import { Exercise } from './exercise';

export interface Workout {
    id: string;
    title: string;
    notes: string;
    date: Date;
    userId: string;
    exercises: WorkoutExercise[];
    deleted: boolean;
}

export interface WorkoutExercise {
    id: number;
    notes: string;
    weightUnit: WeightUnit;
    exerciseId: number | null;
    userExerciseId: number | null;
    exercise: Exercise | null;
    workoutId: string;
    sets: Set[];
    deleted: boolean;
}

export interface Set {
    id: number;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    exerciseId: number;
    deleted: boolean;
}
```

### `types/exercise.ts`
```typescript
import { WeightUnit } from './common';
import { WorkoutExercise } from './workout';

export interface Exercise {
    id: number;
    name: string;
    userId?: string | null;
    deleted?: boolean;
    workoutExercises?: WorkoutExercise[] | null;
}

export interface ExerciseHistory {
    notes: string;
    weightUnit: WeightUnit;
    workout: {
        date: string;
    };
    sets: [{
        weight: number;
        reps: number;
        rpe: number;
    }];
}
```

### `types/auth.ts`
```typescript
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    isAdmin: boolean;
}

export interface RegisterData {
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
```

### `types/common.ts`
```typescript
export type WeightUnit = "lbs" | "kg";

// Add other shared types here as needed
```

### `lib/factories/workout.ts`
```typescript
import { Workout, WorkoutExercise, Set } from '@/types/workout';

export const createEmptyWorkout = (): Workout => ({
    id: "",
    title: `${new Date().toLocaleString("en-CA", {
        dateStyle: "short",
    })} Workout`,
    notes: "",
    date: new Date(),
    userId: "",
    exercises: [],
    deleted: false
});

export const createEmptyWorkoutExercise = (): WorkoutExercise => ({
    id: 0,
    notes: "",
    weightUnit: "lbs",
    exerciseId: null,
    userExerciseId: null,
    exercise: null,
    workoutId: "",
    sets: [],
    deleted: false
});

export const createEmptySet = (): Set => ({
    id: 0,
    weight: null,
    reps: null,
    rpe: null,
    exerciseId: 0,
    deleted: false
});
```

### `lib/factories/index.ts`
```typescript
export * from './workout';
export * from './exercise';
```

---

## 🔄 Migration Impact

**Files to update after restructure:**
- ~10-15 files with imports (automated find/replace)
- Most imports can use `@/types` or `@/lib/factories`

**Effort:** 20-30 minutes

---

## 📊 Naming Conventions Reference

| Folder | Purpose | Examples |
|--------|---------|----------|
| `types/` | TypeScript interfaces and types | `Workout`, `User`, `WeightUnit` |
| `lib/` | Shared library code (non-UI) | API clients, factories, auth helpers |
| `utils/` | Pure utility functions | `formatDate()`, `calculateOneRepMax()` |
| `components/` | React components | `NavBar`, `ExerciseCard` |
| `hooks/` | Custom React hooks | `useAuth()`, `useWorkout()` |
| `pages/` | Next.js routes | `login.tsx`, `workout/[id].tsx` |

---

## ✅ Summary

**Current:** `utils/models/models.ts` ❌  
**Recommended:** `types/` + `lib/` structure ✅

**Should I proceed with Option 1 (split by domain)?**
- Or would you prefer Option 2 (single `types.ts` file)?
