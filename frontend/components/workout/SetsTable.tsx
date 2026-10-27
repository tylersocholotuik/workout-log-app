import SetsTableRow from "./SetsTableRow";
import {useWorkoutExercise} from "@/components/workout/WorkoutExerciseProvider";

import {Set, WeightUnit} from "@/types";

interface SetsTableProps {
    sets: Set[];
    weightUnit: WeightUnit;
    exerciseIndex: number;
}

export default function SetsTable({
    sets,
    weightUnit,
    exerciseIndex,
}: SetsTableProps) {
    const {effortType} = useWorkoutExercise();

    return (
        <div className="grid grid-cols-7 gap-x-2 gap-y-1 justify-items-center items-start">
            <p className="col-span-2 text-sm dark:text-foreground-500 font-semibold mb-1">
                Weight
            </p>
            <p className="col-span-2 text-sm dark:text-foreground-500 font-semibold mb-1">
                Reps
            </p>
            <p className="col-span-2 text-sm dark:text-foreground-500 font-semibold mb-1">
                {effortType.toUpperCase()}
            </p>
            <div></div>
            {sets.map((set, setIndex) => (
                <SetsTableRow
                    key={`exercise-${exerciseIndex}-set-${setIndex}`}
                    set={set}
                    setIndex={setIndex}
                    exerciseIndex={exerciseIndex}
                    weightUnit={weightUnit}
                />
            ))}
        </div>
    );
}
