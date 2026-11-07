import {useState} from "react";

import SetsTableRow from "./SetsTableRow";
import {useWorkoutExercise} from "@/components/workout/WorkoutExerciseProvider";

import {Set, SetTargets} from "@/types";

import {Tooltip, Button} from "@heroui/react";
import {TargetIcon} from "@/icons/TargetIcon";

interface SetsTableProps {
    sets: Set[];
    exerciseIndex: number;
}

// formats a total-seconds target bound (e.g. targetSecondsMin) as "m:ss" to
// match the minutes:seconds display of the duration inputs
const formatDuration = (totalSeconds: number) =>
    `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;

// formats a min/max target pair into a human-readable range (e.g. "5-8",
// "<= 30", ">= 10", or "5" when min and max match)
const formatTargetRange = (
    min: number | null,
    max: number | null,
    formatValue: (value: number) => string = String
) => {
    if (min === null && max === null) {
        return undefined;
    } else if (min !== null && max !== null && min === max) {
        return formatValue(min);
    } else if (min === null && max !== null) {
        return `<= ${formatValue(max)}`;
    } else if (min !== null && max === null) {
        return `>= ${formatValue(min)}`;
    } else {
        return `${formatValue(min as number)}-${formatValue(max as number)}`;
    }
};

// collapses a (possibly non-contiguous) list of 0-based set indices into a
// compact label, e.g. [0] -> "Set 1", [1,2,3] -> "Sets 2-4", [0,2,3] -> "Sets 1, 3-4"
const formatSetLabel = (setIndices: number[]) => {
    const sorted = [...setIndices].sort((a, b) => a - b);
    const ranges: string[] = [];
    let rangeStart = sorted[0];
    let rangeEnd = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === rangeEnd + 1) {
            rangeEnd = sorted[i];
        } else {
            ranges.push(rangeStart === rangeEnd ? `${rangeStart + 1}` : `${rangeStart + 1}-${rangeEnd + 1}`);
            rangeStart = sorted[i];
            rangeEnd = sorted[i];
        }
    }
    ranges.push(rangeStart === rangeEnd ? `${rangeStart + 1}` : `${rangeStart + 1}-${rangeEnd + 1}`);

    return `${sorted.length === 1 ? "Set" : "Sets"} ${ranges.join(", ")}`;
};

// builds the tooltip content lines for a header's target icon, one line per
// target group, e.g. ["Set 1: 1", "Sets 2-4: 5-8"]. Returns undefined when
// none of the groups have a target set for this field.
const buildTargetTooltipContent = (
    targets: SetTargets[],
    getBounds: (target: SetTargets) => [number | null, number | null],
    formatValue?: (value: number) => string
) => {
    const lines = targets
        .map((target) => {
            const [min, max] = getBounds(target);
            const range = formatTargetRange(min, max, formatValue);

            return range ? `${formatSetLabel(target.setIndices)}: ${range}` : null;
        })
        .filter((line): line is string => line !== null);

    return lines.length > 0 ? lines : undefined;
};

export default function SetsTable({
    sets,
    exerciseIndex,
}: SetsTableProps) {

    const [column1TooltipOpen, setColumn1TooltipOpen] = useState(false);
    const [column2TooltipOpen, setColumn2TooltipOpen] = useState(false);
    const [column3TooltipOpen, setColumn3TooltipOpen] = useState(false);

    const {
        showTargets,
        targets,
        effortType,
        exerciseType
    } = useWorkoutExercise();

    const column2Colspan = exerciseType === "reps" || exerciseType === "distance" ? "col-span-2" : "col-span-3";
    const column3Colspan = exerciseType === "reps" || exerciseType === "distance" ? "col-span-2" : "col-span-1";

    // column 1 (Weight/Distance) only has a target for cardio's distance field;
    // weight itself is never targeted
    const column1TargetContent = showTargets && exerciseType === "cardio"
        ? buildTargetTooltipContent(targets, (target) => [target.targetDistanceMin, target.targetDistanceMax])
        : undefined;

    const column2TargetContent = !showTargets ? undefined
        : exerciseType === "reps"
            ? buildTargetTooltipContent(targets, (target) => [target.targetRepsMin, target.targetRepsMax])
            : exerciseType === "distance"
                ? buildTargetTooltipContent(targets, (target) => [target.targetDistanceMin, target.targetDistanceMax])
                : buildTargetTooltipContent(targets, (target) => [target.targetSecondsMin, target.targetSecondsMax], formatDuration);

    const column3TargetContent = showTargets
        ? buildTargetTooltipContent(targets, (target) => [target.targetEffortMin, target.targetEffortMax])
        : undefined;

    const renderTargetIndicator = (
        content: string[] | undefined,
        isOpen: boolean,
        setIsOpen: (isOpen: boolean) => void,
        ariaLabel: string
    ) => {
        if (!content) {
            return null;
        }

        return (
            <Tooltip
                content={
                    <div className="flex flex-col">
                        <p className="font-semibold mb-1">Target</p>
                        {content.map((line) => (
                            <p key={line}>{line}</p>
                        ))}
                    </div>
                }
                isOpen={isOpen}
                onOpenChange={(open) => {
                    // only react to the tooltip closing itself (e.g. outside
                    // click/blur/escape); toggling on press is handled below
                    if (!open) {
                        setIsOpen(false);
                    }
                }}
            >
                <Button
                    isIconOnly
                    aria-label={ariaLabel}
                    className="min-w-0 w-4 h-4 text-foreground-400"
                    size="sm"
                    variant="light"
                    onPointerDown={() => setIsOpen(!isOpen)}
                    onPress={(e) => {
                        if (e.pointerType === "keyboard" || e.pointerType === "virtual") {
                            setIsOpen(!isOpen);
                        }
                    }}
                >
                    <TargetIcon />
                </Button>
            </Tooltip>
        );
    };

    return (
        <div className="grid grid-cols-7 gap-x-2 gap-y-1 justify-items-center items-start">
            <div className="col-span-2 flex items-center gap-1 mb-1">
                <p className="text-sm dark:text-foreground-500 font-semibold">
                    {exerciseType === "cardio" ? "Distance" : "Weight"}
                </p>
                {renderTargetIndicator(column1TargetContent, column1TooltipOpen, setColumn1TooltipOpen, "distance targets")}
            </div>
            <div className={`${column2Colspan} flex items-center gap-1 mb-1`}>
                <p className="text-sm dark:text-foreground-500 font-semibold">
                    {exerciseType === "reps" ? "Reps" : exerciseType === "distance" ? "Distance" : "Duration (mm:ss)"}
                </p>
                {renderTargetIndicator(column2TargetContent, column2TooltipOpen, setColumn2TooltipOpen, "reps, distance, or duration targets")}
            </div>
            <div className={`${column3Colspan} flex items-center gap-1 mb-1`}>
                <p className="text-sm dark:text-foreground-500 font-semibold">
                    {effortType.toUpperCase()}
                </p>
                {renderTargetIndicator(column3TargetContent, column3TooltipOpen, setColumn3TooltipOpen, "effort targets")}
            </div>
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
