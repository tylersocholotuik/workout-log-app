import SetsTableRow from "./SetsTableRow";
import {useWorkoutExercise} from "@/components/workout/WorkoutExerciseProvider";

import {Set, WeightUnit, DistanceUnit} from "@/types";

interface SetsTableProps {
    sets: Set[];
    exerciseIndex: number;
}

export default function SetsTable({
    sets,
    exerciseIndex,
}: SetsTableProps) {
    
    const {
        effortType, 
        weightUnit, 
        distanceUnit, 
        exerciseType
    } = useWorkoutExercise();
    
    const column2Colspan = exerciseType === "reps" || exerciseType === "distance" ? "col-span-2" : "col-span-3";
    const column3Colspan = exerciseType === "reps" || exerciseType === "distance" ? "col-span-2" : "col-span-1";
    
    return (
        <div className="grid grid-cols-7 gap-x-2 gap-y-1 justify-items-center items-start">
            <p className="col-span-2 text-sm dark:text-foreground-500 font-semibold mb-1">
                {exerciseType === "cardio" ? "Distance" : "Weight"}
            </p>
            <p className={`${column2Colspan} text-sm dark:text-foreground-500 font-semibold mb-1`}>
                {exerciseType === "reps" ? "Reps" : exerciseType === "distance" ? "Distance" : "Duration (mm:ss)"}
            </p>
            <p className={`${column3Colspan} text-sm dark:text-foreground-500 font-semibold mb-1`}>
                {effortType.toUpperCase()}
            </p>
            <div></div>
            {sets.map((set, setIndex) => (
                <SetsTableRow
                    key={`exercise-${exerciseIndex}-set-${setIndex}`}
                    set={set}
                    setIndex={setIndex}
                    exerciseIndex={exerciseIndex}
                />
            ))}
        </div>
    );
}
