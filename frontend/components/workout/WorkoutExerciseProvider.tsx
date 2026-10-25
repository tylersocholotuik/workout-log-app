import {createContext, useContext, ReactNode} from "react";
import {SetTargets} from "@/types";

interface WorkoutExerciseContextType {
    showTargets: boolean;
    targets: SetTargets[];
    effortType: string;
}

interface WorkoutExerciseProviderProps extends WorkoutExerciseContextType {
    children: ReactNode;
}

export const WorkoutExerciseContext = createContext<WorkoutExerciseContextType | undefined>(
    undefined
);

export const useWorkoutExercise = () => {
    const context = useContext(WorkoutExerciseContext);
    if (!context) {
        throw new Error(
            "useWorkoutExercise must be used within a WorkoutExerciseProvider"
        );
    }
    return context;
};

export default function WorkoutExerciseProvider({
    showTargets,
    targets,
    effortType,
    children,
}: WorkoutExerciseProviderProps) {
    return (
        <WorkoutExerciseContext.Provider value={{ showTargets, targets, effortType }}>
            {children}
        </WorkoutExerciseContext.Provider>
    );
}