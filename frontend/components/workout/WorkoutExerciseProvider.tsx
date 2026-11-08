import {createContext, useContext, ReactNode} from "react";
import {SetTargets, WeightUnit, DistanceUnit, ExerciseType} from "@/types";

interface WorkoutExerciseContextType {
    showTargets: boolean;
    targets: SetTargets[];
    effortType: string;
    weightUnit: WeightUnit | null;
    distanceUnit: DistanceUnit | null;
    exerciseType: ExerciseType;
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
                                                    weightUnit,
                                                    distanceUnit,
                                                    exerciseType,
                                                    children,
                                                }: WorkoutExerciseProviderProps) {
    return (
        <WorkoutExerciseContext.Provider
            value={{showTargets, targets, effortType, weightUnit, distanceUnit, exerciseType}}>
            {children}
        </WorkoutExerciseContext.Provider>
    );
}