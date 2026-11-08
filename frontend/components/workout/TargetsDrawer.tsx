import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Selection,
    Checkbox,
    Divider
} from "@heroui/react";

import {useWorkoutContext} from "@/pages/workout/[workoutId]";
import {useWorkoutExercise} from "@/components/workout/WorkoutExerciseProvider";

import {Dispatch, SetStateAction, useMemo, useState} from "react";

import {WorkoutExercise, SetTargets} from "@/types";
import {deriveAppliesToAllSets} from "@/components/workout/ExerciseCard";

import {DISTANCE_UNIT_LABELS} from "@/lib/constants/labels";
import {handleInputChange, sanitizeDisplayValues} from "@/utils/inputHandlers";
import {
    REPS_REGEX,
    REPS_MIN,
    REPS_MAX,
    DISTANCE_REGEX,
    DISTANCE_MIN,
    DISTANCE_MAX,
    DURATION_MINUTES_REGEX,
    DURATION_MINUTES_MIN,
    DURATION_MINUTES_MAX,
    DURATION_SECONDS_REGEX,
    DURATION_SECONDS_MIN,
    DURATION_SECONDS_MAX,
    RPE_REGEX,
    RIR_REGEX,
    EFFORT_RATING_MIN,
    EFFORT_RATING_MAX,
} from "@/lib/constants/validation";

interface TargetsDrawerProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    exercise: WorkoutExercise;
    exerciseIndex: number;
}

interface TargetDraftStrings {
    targetRepsMin: string;
    targetRepsMax: string;
    targetEffortMin: string;
    targetEffortMax: string;
    targetDistanceMin: string;
    targetDistanceMax: string;
    targetDurationMinMinutes: string;
    targetDurationMinSeconds: string;
    targetDurationMaxMinutes: string;
    targetDurationMaxSeconds: string;
}

const toDraftStrings = (target: SetTargets): TargetDraftStrings => ({
    targetRepsMin: target.targetRepsMin !== null ? String(target.targetRepsMin) : "",
    targetRepsMax: target.targetRepsMax !== null ? String(target.targetRepsMax) : "",
    targetEffortMin: target.targetEffortMin !== null ? String(target.targetEffortMin) : "",
    targetEffortMax: target.targetEffortMax !== null ? String(target.targetEffortMax) : "",
    targetDistanceMin: target.targetDistanceMin !== null ? String(target.targetDistanceMin) : "",
    targetDistanceMax: target.targetDistanceMax !== null ? String(target.targetDistanceMax) : "",
    targetDurationMinMinutes: target.targetSecondsMin !== null ? String(Math.floor(target.targetSecondsMin / 60)) : "",
    targetDurationMinSeconds: target.targetSecondsMin !== null ? String(target.targetSecondsMin % 60).padStart(2, "0") : "",
    targetDurationMaxMinutes: target.targetSecondsMax !== null ? String(Math.floor(target.targetSecondsMax / 60)) : "",
    targetDurationMaxSeconds: target.targetSecondsMax !== null ? String(target.targetSecondsMax % 60).padStart(2, "0") : "",
});

// combines a duration bound's minutes/seconds draft strings back into total seconds,
// null if both are empty
const combineDuration = (minutes: string, seconds: string): number | null =>
    minutes !== "" || seconds !== ""
        ? (minutes !== "" ? parseInt(minutes) : 0) * 60 + (seconds !== "" ? parseInt(seconds) : 0)
        : null;

// splits a total-seconds duration bound back into draft strings, e.g. when a
// min/max swap derives a new value that needs to be reflected in both fields
const splitDuration = (totalSeconds: number) => ({
    minutes: String(Math.floor(totalSeconds / 60)),
    seconds: String(totalSeconds % 60).padStart(2, "0"),
});

const parseTargetDraft = (draft: TargetDraftStrings) => ({
    targetRepsMin: draft.targetRepsMin !== "" ? parseInt(draft.targetRepsMin) : null,
    targetRepsMax: draft.targetRepsMax !== "" ? parseInt(draft.targetRepsMax) : null,
    targetEffortMin: draft.targetEffortMin !== "" ? parseFloat(draft.targetEffortMin) : null,
    targetEffortMax: draft.targetEffortMax !== "" ? parseFloat(draft.targetEffortMax) : null,
    targetDistanceMin: draft.targetDistanceMin !== "" ? parseFloat(draft.targetDistanceMin) : null,
    targetDistanceMax: draft.targetDistanceMax !== "" ? parseFloat(draft.targetDistanceMax) : null,
    targetSecondsMin: combineDuration(draft.targetDurationMinMinutes, draft.targetDurationMinSeconds),
    targetSecondsMax: combineDuration(draft.targetDurationMaxMinutes, draft.targetDurationMaxSeconds),
});

export default function TargetsDrawer({
                                          isOpen,
                                          onOpenChange,
                                          exercise,
                                          exerciseIndex
                                      }: TargetsDrawerProps) {
    const {targets, effortType, exerciseType, distanceUnit} = useWorkoutExercise();
    const {setWorkout} = useWorkoutContext();

    const effortTypeLabel = useMemo(() => {
        return effortType === "rpe" ? "RPE" : "RIR";
    }, [effortType]);

    const effortRegex = effortType === "rpe" ? RPE_REGEX : RIR_REGEX;
    const effortIsInteger = effortType === "rir";
    const distanceUnitLabel = DISTANCE_UNIT_LABELS[distanceUnit || "meters"];

    // local draft strings per target row, so handleInputChange (which
    // expects a single Dispatch<SetStateAction<string>>) can be reused
    const [targetDrafts, setTargetDrafts] = useState<TargetDraftStrings[]>(() =>
        targets.map(toDraftStrings)
    );

    // source of truth per row is always a concrete Set of 0-based set indices -
    // never HeroUI's reserved "all" sentinel string, which (if stored/passed as
    // selectedKeys) means "every item, including ones added later" and would make
    // the Select visually claim sets that don't actually have the target applied
    const [selectedSetsByTarget, setSelectedSetsByTarget] = useState<Set<number>[]>(() =>
        targets.map((target) => new Set(target.setIndices))
    );

    // targets is derived fresh from the exercise's sets, so it's always accurate -
    // reseed the local per-row draft/selection state from it whenever the drawer
    // opens, picking up any sets added/removed while it was closed
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            setTargetDrafts(targets.map(toDraftStrings));
            setSelectedSetsByTarget(targets.map((target) => new Set(target.setIndices)));
        }
    }

    // "apply to all sets" per row: true only for the row whose indices cover every
    // current set, and only when that's the exercise's actual intent (not just coincidence)
    const appliesToAllSets = deriveAppliesToAllSets(exercise, targets);
    const appliesToAllByTarget = selectedSetsByTarget.map(
        (indices) => appliesToAllSets && indices.size > 0 && indices.size === exercise.sets.length
    );

    // builds a setter for one field of one row, matching handleInputChange's expected type
    const makeDraftSetter = (
        targetIndex: number,
        field: keyof TargetDraftStrings
    ): Dispatch<SetStateAction<string>> => (value) => {
        setTargetDrafts((prev) =>
            prev.map((draft, i) => {
                if (i !== targetIndex) {
                    return draft;
                }
                const resolved =
                    typeof value === "function" ? value(draft[field]) : value;
                return {...draft, [field]: resolved};
            })
        );
    };

    // on blur: sanitize display strings, parse to numbers, commit to every
    // set the row currently applies to
    const commitTargetDraft = (targetIndex: number) => {
        const draft = targetDrafts[targetIndex];

        sanitizeDisplayValues([
            {value: draft.targetRepsMin, setter: makeDraftSetter(targetIndex, "targetRepsMin"), stripLeadingZero: true},
            {value: draft.targetRepsMax, setter: makeDraftSetter(targetIndex, "targetRepsMax"), stripLeadingZero: true},
            {
                value: draft.targetEffortMin,
                setter: makeDraftSetter(targetIndex, "targetEffortMin"),
                stripTrailingDecimal: true
            },
            {
                value: draft.targetEffortMax,
                setter: makeDraftSetter(targetIndex, "targetEffortMax"),
                stripTrailingDecimal: true
            },
            {
                value: draft.targetDistanceMin,
                setter: makeDraftSetter(targetIndex, "targetDistanceMin"),
                stripTrailingDecimal: true,
                stripLeadingZero: true
            },
            {
                value: draft.targetDistanceMax,
                setter: makeDraftSetter(targetIndex, "targetDistanceMax"),
                stripTrailingDecimal: true,
                stripLeadingZero: true
            },
            {
                value: draft.targetDurationMinMinutes,
                setter: makeDraftSetter(targetIndex, "targetDurationMinMinutes"),
                stripLeadingZero: true
            },
            {
                value: draft.targetDurationMaxMinutes,
                setter: makeDraftSetter(targetIndex, "targetDurationMaxMinutes"),
                stripLeadingZero: true
            },
        ]);

        // re-pad the duration seconds fields to 2 digits
        makeDraftSetter(targetIndex, "targetDurationMinSeconds")((prev) =>
            prev !== "" ? String(parseInt(prev)).padStart(2, "0") : ""
        );
        makeDraftSetter(targetIndex, "targetDurationMaxSeconds")((prev) =>
            prev !== "" ? String(parseInt(prev)).padStart(2, "0") : ""
        );

        const targetRepsMin = draft.targetRepsMin !== "" ? parseInt(draft.targetRepsMin) : null;
        let targetRepsMax = draft.targetRepsMax !== "" ? parseInt(draft.targetRepsMax) : null;
        const targetEffortMin = draft.targetEffortMin !== "" ? parseFloat(draft.targetEffortMin) : null;
        let targetEffortMax = draft.targetEffortMax !== "" ? parseFloat(draft.targetEffortMax) : null;
        const targetDistanceMin = draft.targetDistanceMin !== "" ? parseFloat(draft.targetDistanceMin) : null;
        let targetDistanceMax = draft.targetDistanceMax !== "" ? parseFloat(draft.targetDistanceMax) : null;
        const targetSecondsMin = combineDuration(draft.targetDurationMinMinutes, draft.targetDurationMinSeconds);
        let targetSecondsMax = combineDuration(draft.targetDurationMaxMinutes, draft.targetDurationMaxSeconds);

        // ensure min <= max for reps, effort, distance, and duration; if not,
        // set max = min and update draft strings
        if ((targetRepsMin !== null && targetRepsMax !== null) && (targetRepsMax < targetRepsMin)) {
            targetRepsMax = targetRepsMin;
            setTargetDrafts((prev) =>
                prev.map((draft, i) =>
                    i === targetIndex ? {...draft, targetRepsMax: String(targetRepsMax)} : draft
                )
            );
        }

        if ((targetEffortMin !== null && targetEffortMax !== null) && (targetEffortMax < targetEffortMin)) {
            targetEffortMax = targetEffortMin;
            setTargetDrafts((prev) =>
                prev.map((draft, i) =>
                    i === targetIndex ? {...draft, targetEffortMax: String(targetEffortMax)} : draft
                )
            );
        }

        if ((targetDistanceMin !== null && targetDistanceMax !== null) && (targetDistanceMax < targetDistanceMin)) {
            targetDistanceMax = targetDistanceMin;
            setTargetDrafts((prev) =>
                prev.map((draft, i) =>
                    i === targetIndex ? {...draft, targetDistanceMax: String(targetDistanceMax)} : draft
                )
            );
        }

        if ((targetSecondsMin !== null && targetSecondsMax !== null) && (targetSecondsMax < targetSecondsMin)) {
            targetSecondsMax = targetSecondsMin;
            const {minutes, seconds} = splitDuration(targetSecondsMax);
            setTargetDrafts((prev) =>
                prev.map((draft, i) =>
                    i === targetIndex
                        ? {...draft, targetDurationMaxMinutes: minutes, targetDurationMaxSeconds: seconds}
                        : draft
                )
            );
        }

        const setIndices = Array.from(selectedSetsByTarget[targetIndex]);

        setWorkout((prevWorkout) => ({
            ...prevWorkout,
            exercises: prevWorkout.exercises.map((ex, eIndex) =>
                eIndex === exerciseIndex
                    ? {
                        ...ex,
                        sets: ex.sets.map((set, sIndex) =>
                            setIndices.includes(sIndex)
                                ? {
                                    ...set,
                                    targetRepsMin,
                                    targetRepsMax,
                                    targetEffortMin,
                                    targetEffortMax,
                                    targetDistanceMin,
                                    targetDistanceMax,
                                    targetSecondsMin,
                                    targetSecondsMax,
                                }
                                : set
                        ),
                    }
                    : ex
            ),
        }));
    };

    // clicking outside the drawer (or pressing Escape) closes it without
    // blurring the focused input, so commit all drafts here too
    const handleDrawerOpenChange = (open: boolean) => {
        if (!open) {
            targetDrafts.forEach((_, targetIndex) => commitTargetDraft(targetIndex));
        }
        onOpenChange(open);
    };

    // diffs the new selection against the previous one, writes target values onto
    // added sets and clears them from removed sets
    const handleSelectionChange = (targetIndex: number, selection: Selection) => {
        const previousIndices = selectedSetsByTarget[targetIndex];
        const newIndices = selection === "all"
            ? new Set(exercise.sets.map((_, setIndex) => setIndex))
            : new Set(Array.from(selection, (key) => Number(key)));

        const added = Array.from(newIndices).filter((i) => !previousIndices.has(i));
        const removed = Array.from(previousIndices).filter((i) => !newIndices.has(i));

        setSelectedSetsByTarget((prev) =>
            prev.map((s, i) => (i === targetIndex ? newIndices : s))
        );

        const {
            targetRepsMin,
            targetRepsMax,
            targetEffortMin,
            targetEffortMax,
            targetDistanceMin,
            targetDistanceMax,
            targetSecondsMin,
            targetSecondsMax,
        } = parseTargetDraft(targetDrafts[targetIndex]);

        setWorkout((prevWorkout) => ({
            ...prevWorkout,
            exercises: prevWorkout.exercises.map((ex, eIndex) =>
                eIndex === exerciseIndex
                    ? {
                        ...ex,
                        sets: ex.sets.map((set, sIndex) => {
                            if (added.includes(sIndex)) {
                                return {
                                    ...set,
                                    targetRepsMin,
                                    targetRepsMax,
                                    targetEffortMin,
                                    targetEffortMax,
                                    targetDistanceMin,
                                    targetDistanceMax,
                                    targetSecondsMin,
                                    targetSecondsMax,
                                };
                            }
                            if (removed.includes(sIndex)) {
                                return {
                                    ...set,
                                    targetRepsMin: null,
                                    targetRepsMax: null,
                                    targetEffortMin: null,
                                    targetEffortMax: null,
                                    targetDistanceMin: null,
                                    targetDistanceMax: null,
                                    targetSecondsMin: null,
                                    targetSecondsMax: null,
                                };
                            }
                            return set;
                        }),
                    }
                    : ex
            ),
        }));
    };

    // turns "apply to all sets" on/off for a row. Turning it on claims every set
    // (so it's only enabled when no other row has claims); turning it off just
    // stops future sets from inheriting it - sets already covered keep the target
    const handleApplyToAllChange = (targetIndex: number, checked: boolean) => {
        const previousIndices = selectedSetsByTarget[targetIndex];
        const newIndices = checked
            ? new Set(exercise.sets.map((_, setIndex) => setIndex))
            : previousIndices;
        const added = Array.from(newIndices).filter((i) => !previousIndices.has(i));

        setSelectedSetsByTarget((prev) =>
            prev.map((s, i) => (i === targetIndex ? newIndices : s))
        );

        const {
            targetRepsMin,
            targetRepsMax,
            targetEffortMin,
            targetEffortMax,
            targetDistanceMin,
            targetDistanceMax,
            targetSecondsMin,
            targetSecondsMax,
        } = parseTargetDraft(targetDrafts[targetIndex]);

        setWorkout((prevWorkout) => ({
            ...prevWorkout,
            exercises: prevWorkout.exercises.map((ex, eIndex) =>
                eIndex === exerciseIndex
                    ? {
                        ...ex,
                        targetAppliesToAllSets: checked,
                        sets: ex.sets.map((set, sIndex) =>
                            added.includes(sIndex)
                                ? {
                                    ...set,
                                    targetRepsMin,
                                    targetRepsMax,
                                    targetEffortMin,
                                    targetEffortMax,
                                    targetDistanceMin,
                                    targetDistanceMax,
                                    targetSecondsMin,
                                    targetSecondsMax,
                                }
                                : set
                        ),
                    }
                    : ex
            ),
        }));
    };

    // disable sets claimed by other rows
    const disabledKeysByTarget = targetDrafts.map((_, targetIndex) => {
        const claimed = new Set<string>();
        selectedSetsByTarget.forEach((indices, otherIndex) => {
            if (otherIndex === targetIndex) {
                return;
            }
            indices.forEach((setIndex) => claimed.add(String(setIndex)));
        });
        return claimed;
    });

    // a row can only turn on "apply to all sets" if no other row has any claims
    const canApplyToAllByTarget = selectedSetsByTarget.map((_, targetIndex) =>
        exercise.sets.length > 0 &&
        selectedSetsByTarget.every((indices, i) => i === targetIndex || indices.size === 0)
    );

    const cannotAddTarget = useMemo(() => {
        const claimed = new Set<number>();
        selectedSetsByTarget.forEach((indices) => {
            indices.forEach((setIndex) => claimed.add(setIndex));
        });
        const unclaimedSets = exercise.sets.length - claimed.size;
        const emptyTargets = selectedSetsByTarget.filter((indices) => indices.size === 0).length;
        return unclaimedSets - emptyTargets <= 0;
    }, [selectedSetsByTarget, exercise.sets.length]);

    const addTarget = () => {
        const emptyTargetDraft = {
            targetRepsMin: "",
            targetRepsMax: "",
            targetEffortMin: "",
            targetEffortMax: "",
            targetDistanceMin: "",
            targetDistanceMax: "",
            targetDurationMinMinutes: "",
            targetDurationMinSeconds: "",
            targetDurationMaxMinutes: "",
            targetDurationMaxSeconds: "",
        };

        setTargetDrafts((prev) => [...prev, emptyTargetDraft]);

        setSelectedSetsByTarget((prev) => [...prev, new Set<number>()]);
    }

    const removeTarget = (targetIndex: number) => {
        const setIndicesToRemove = Array.from(selectedSetsByTarget[targetIndex]);
        const wasAppliesToAllSets = appliesToAllByTarget[targetIndex];

        setTargetDrafts((prev) => prev.filter((_, i) => i !== targetIndex));
        setSelectedSetsByTarget((prev) => prev.filter((_, i) => i !== targetIndex));

        setWorkout((prevWorkout) => ({
            ...prevWorkout,
            exercises: prevWorkout.exercises.map((ex, eIndex) =>
                eIndex === exerciseIndex
                    ? {
                        ...ex,
                        targetAppliesToAllSets: wasAppliesToAllSets ? false : ex.targetAppliesToAllSets,
                        sets: ex.sets.map((set, sIndex) =>
                            setIndicesToRemove.includes(sIndex)
                                ? {
                                    ...set,
                                    targetRepsMin: null,
                                    targetRepsMax: null,
                                    targetEffortMin: null,
                                    targetEffortMax: null,
                                    targetDistanceMin: null,
                                    targetDistanceMax: null,
                                    targetSecondsMin: null,
                                    targetSecondsMax: null,
                                }
                                : set
                        ),
                    }
                    : ex
            ),
        }));
    }

    // visually matches HeroUI's "outside" label styling,
    // but as a normal block element instead of an absolutely-positioned floating label.
    // HeroUI's "outside" label only moves above the input once it has a value or focus
    // (group-data-[filled-within=true]), so it sits inline over empty inputs - clashing
    // with endContent (e.g. the distance unit) and, for narrow inputs, wrapping awkwardly.
    // A real label rendered above the input always stays there, value or not.
    const renderFieldLabel = (htmlFor: string, text: string) => (
        <label htmlFor={htmlFor} className="text-tiny font-bold">
            {text}
        </label>
    );

    // "Min Reps"/"Max Reps" pair, used when exerciseType === "reps"
    const renderRepsPair = (targetIndex: number, colSpanClassName: string) => (
        <div className={`flex gap-2 ${colSpanClassName}`}>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {renderFieldLabel(`target-${targetIndex}-reps-min`, "Min Reps")}
                <Input
                    id={`target-${targetIndex}-reps-min`}
                    size="sm"
                    value={targetDrafts[targetIndex].targetRepsMin}
                    inputMode="decimal"
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: REPS_REGEX,
                            isInteger: true,
                            minValue: REPS_MIN,
                            maxValue: REPS_MAX,
                            setter: makeDraftSetter(targetIndex, "targetRepsMin"),
                        });
                    }}
                    onBlur={() => commitTargetDraft(targetIndex)}
                />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {renderFieldLabel(`target-${targetIndex}-reps-max`, "Max Reps")}
                <Input
                    id={`target-${targetIndex}-reps-max`}
                    size="sm"
                    value={targetDrafts[targetIndex].targetRepsMax}
                    inputMode="decimal"
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: REPS_REGEX,
                            isInteger: true,
                            minValue: REPS_MIN,
                            maxValue: REPS_MAX,
                            setter: makeDraftSetter(targetIndex, "targetRepsMax"),
                        });
                    }}
                    onBlur={() => commitTargetDraft(targetIndex)}
                />
            </div>
        </div>
    );

    // "Min Distance"/"Max Distance" pair, used when exerciseType === "distance" or "cardio"
    const renderDistancePair = (targetIndex: number, colSpanClassName: string) => (
        <div className={`flex gap-2 ${colSpanClassName}`}>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {renderFieldLabel(`target-${targetIndex}-distance-min`, "Min Distance")}
                <Input
                    id={`target-${targetIndex}-distance-min`}
                    size="sm"
                    value={targetDrafts[targetIndex].targetDistanceMin}
                    inputMode="decimal"
                    endContent={
                        <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">{distanceUnitLabel}</span>
                        </div>
                    }
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: DISTANCE_REGEX,
                            isInteger: false,
                            minValue: DISTANCE_MIN,
                            maxValue: DISTANCE_MAX,
                            step: 0.1,
                            setter: makeDraftSetter(targetIndex, "targetDistanceMin"),
                        });
                    }}
                    onBlur={() => commitTargetDraft(targetIndex)}
                />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {renderFieldLabel(`target-${targetIndex}-distance-max`, "Max Distance")}
                <Input
                    id={`target-${targetIndex}-distance-max`}
                    size="sm"
                    value={targetDrafts[targetIndex].targetDistanceMax}
                    inputMode="decimal"
                    endContent={
                        <div className="pointer-events-none flex items-center">
                            <span className="text-default-400 text-small">{distanceUnitLabel}</span>
                        </div>
                    }
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: DISTANCE_REGEX,
                            isInteger: false,
                            minValue: DISTANCE_MIN,
                            maxValue: DISTANCE_MAX,
                            step: 0.1,
                            setter: makeDraftSetter(targetIndex, "targetDistanceMax"),
                        });
                    }}
                    onBlur={() => commitTargetDraft(targetIndex)}
                />
            </div>
        </div>
    );

    // "Min Duration"/"Max Duration" pair (each a minutes:seconds compound field),
    // used when exerciseType === "time" or "cardio". The label sits above the whole
    // minutes+seconds group (not just the minutes input), so it has the full group's
    // width to lay out in and doesn't need to wrap the way a per-input label would.
    // Only the minutes input is labeled/given an id; seconds relies on its aria-label.
    const renderDurationPair = (targetIndex: number, colSpanClassName: string) => (
        <div className={`flex gap-2 ${colSpanClassName}`}>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {renderFieldLabel(`target-${targetIndex}-duration-min-minutes`, "Min Duration")}
                <div className="flex gap-1 items-center">
                    <Input
                        id={`target-${targetIndex}-duration-min-minutes`}
                        size="sm"
                        aria-label="minutes"
                        classNames={{input: "text-center"}}
                        value={targetDrafts[targetIndex].targetDurationMinMinutes}
                        inputMode="decimal"
                        onValueChange={(value) => {
                            handleInputChange({
                                value,
                                regex: DURATION_MINUTES_REGEX,
                                isInteger: true,
                                minValue: DURATION_MINUTES_MIN,
                                maxValue: DURATION_MINUTES_MAX,
                                setter: makeDraftSetter(targetIndex, "targetDurationMinMinutes"),
                            });
                        }}
                        onBlur={() => commitTargetDraft(targetIndex)}
                    />
                    <span>:</span>
                    <Input
                        size="sm"
                        aria-label="seconds"
                        classNames={{input: "text-center"}}
                        value={targetDrafts[targetIndex].targetDurationMinSeconds}
                        inputMode="decimal"
                        onValueChange={(value) => {
                            handleInputChange({
                                value,
                                regex: DURATION_SECONDS_REGEX,
                                isInteger: true,
                                minValue: DURATION_SECONDS_MIN,
                                maxValue: DURATION_SECONDS_MAX,
                                setter: makeDraftSetter(targetIndex, "targetDurationMinSeconds"),
                            });
                        }}
                        onBlur={() => commitTargetDraft(targetIndex)}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {renderFieldLabel(`target-${targetIndex}-duration-max-minutes`, "Max Duration")}
                <div className="flex gap-1 items-center">
                    <Input
                        id={`target-${targetIndex}-duration-max-minutes`}
                        size="sm"
                        aria-label="minutes"
                        classNames={{input: "text-center"}}
                        value={targetDrafts[targetIndex].targetDurationMaxMinutes}
                        inputMode="decimal"
                        onValueChange={(value) => {
                            handleInputChange({
                                value,
                                regex: DURATION_MINUTES_REGEX,
                                isInteger: true,
                                minValue: DURATION_MINUTES_MIN,
                                maxValue: DURATION_MINUTES_MAX,
                                setter: makeDraftSetter(targetIndex, "targetDurationMaxMinutes"),
                            });
                        }}
                        onBlur={() => commitTargetDraft(targetIndex)}
                    />
                    <span>:</span>
                    <Input
                        size="sm"
                        aria-label="seconds"
                        classNames={{input: "text-center"}}
                        value={targetDrafts[targetIndex].targetDurationMaxSeconds}
                        inputMode="decimal"
                        onValueChange={(value) => {
                            handleInputChange({
                                value,
                                regex: DURATION_SECONDS_REGEX,
                                isInteger: true,
                                minValue: DURATION_SECONDS_MIN,
                                maxValue: DURATION_SECONDS_MAX,
                                setter: makeDraftSetter(targetIndex, "targetDurationMaxSeconds"),
                            });
                        }}
                        onBlur={() => commitTargetDraft(targetIndex)}
                    />
                </div>
            </div>
        </div>
    );

    // "Min <RPE/RIR>"/"Max <RPE/RIR>" pair, rendered for every exercise type
    const renderEffortPair = (targetIndex: number, colSpanClassName: string) => (
        <div className={`flex gap-2 ${colSpanClassName}`}>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {renderFieldLabel(`target-${targetIndex}-effort-min`, `Min ${effortTypeLabel}`)}
                <Input
                    id={`target-${targetIndex}-effort-min`}
                    size="sm"
                    value={targetDrafts[targetIndex].targetEffortMin}
                    inputMode="decimal"
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: effortRegex,
                            isInteger: effortIsInteger,
                            minValue: EFFORT_RATING_MIN,
                            maxValue: EFFORT_RATING_MAX,
                            setter: makeDraftSetter(targetIndex, "targetEffortMin"),
                        });
                    }}
                    onBlur={() => commitTargetDraft(targetIndex)}
                />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                {renderFieldLabel(`target-${targetIndex}-effort-max`, `Max ${effortTypeLabel}`)}
                <Input
                    id={`target-${targetIndex}-effort-max`}
                    size="sm"
                    value={targetDrafts[targetIndex].targetEffortMax}
                    inputMode="decimal"
                    onValueChange={(value) => {
                        handleInputChange({
                            value,
                            regex: effortRegex,
                            isInteger: effortIsInteger,
                            minValue: EFFORT_RATING_MIN,
                            maxValue: EFFORT_RATING_MAX,
                            setter: makeDraftSetter(targetIndex, "targetEffortMax"),
                        });
                    }}
                    onBlur={() => commitTargetDraft(targetIndex)}
                />
            </div>
        </div>
    );

    // "Apply to all" checkbox + "Apply to Sets" multi-select, rendered for every exercise type
    const renderApplySection = (targetIndex: number, colSpanClassName: string) => (
        <div className={`flex flex-col gap-2 ${colSpanClassName}`}>
            <Checkbox
                // forces the native checkbox to remount on every logical value
                // change - works around a mobile WebKit bug where the controlled
                // `isSelected` state updates correctly but the checked visual
                // doesn't repaint, since the native input toggles its own
                // `checked` DOM property on tap before React re-renders
                key={appliesToAllByTarget[targetIndex] ? "checked" : "unchecked"}
                classNames={{label: "text-tiny"}}
                size="sm"
                isSelected={appliesToAllByTarget[targetIndex]}
                isDisabled={!canApplyToAllByTarget[targetIndex]}
                onValueChange={(checked) => handleApplyToAllChange(targetIndex, checked)}
            >
                Apply to all
            </Checkbox>
            {!appliesToAllByTarget[targetIndex] &&
                <div className="flex flex-col gap-1">
                    {renderFieldLabel(`target-${targetIndex}-apply-to-sets`, "Apply to Sets")}
                    <Select
                        id={`target-${targetIndex}-apply-to-sets`}
                        aria-label="Apply to Sets"
                        selectionMode="multiple"
                        size="sm"
                        selectedKeys={new Set(Array.from(selectedSetsByTarget[targetIndex], String))}
                        disabledKeys={disabledKeysByTarget[targetIndex]}
                        onSelectionChange={(selection) => handleSelectionChange(targetIndex, selection)}
                        renderValue={() =>
                            Array.from(selectedSetsByTarget[targetIndex])
                                .sort((a, b) => a - b)
                                .map((setIndex) => setIndex + 1)
                                .join(", ")
                        }
                    >
                        {exercise.sets.map((_, setIndex) => (
                            <SelectItem key={String(setIndex)}>
                                {`${setIndex + 1}`}
                            </SelectItem>
                        ))}
                    </Select>
                </div>
            }
        </div>
    );
    
    const renderTargetRow = (targetIndex: number) => {
        if (exerciseType === "cardio") {
            return <>
                <div className="grid grid-cols-1 sm:grid-cols-8 gap-4 items-end">
                    {renderDistancePair(targetIndex, "col-span-1 sm:col-span-3")}
                    {renderDurationPair(targetIndex, "col-span-1 sm:col-span-5")}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-8 gap-4 items-end">
                    {renderEffortPair(targetIndex, "col-span-1 sm:col-span-4")}
                    {renderApplySection(targetIndex, "col-span-1 sm:col-span-4")}
                </div>
            </>;
        }

        if (exerciseType === "distance") {
            return <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                {renderDistancePair(targetIndex, "col-span-1 sm:col-span-2")}
                {renderEffortPair(targetIndex, "col-span-1 sm:col-span-2")}
                {renderApplySection(targetIndex, "col-span-1 sm:col-span-1")}
            </div>;
        }

        if (exerciseType === "time") {
            return <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-end">
                {renderDurationPair(targetIndex, "col-span-1 sm:col-span-3")}
                {renderEffortPair(targetIndex, "col-span-1 sm:col-span-2")}
                {renderApplySection(targetIndex, "col-span-1 sm:col-span-1")}
            </div>;
        }

        return <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
            {renderRepsPair(targetIndex, "col-span-1 sm:col-span-2")}
            {renderEffortPair(targetIndex, "col-span-1 sm:col-span-2")}
            {renderApplySection(targetIndex, "col-span-1 sm:col-span-1")}
        </div>;
    };

    return <>
        <Drawer
            isOpen={isOpen}
            onOpenChange={handleDrawerOpenChange}
            size="2xl"
            scrollBehavior="inside"
            classNames={{
                base: "h-[100dvh] max-h-[100dvh]",
                body: "overflow-y-auto min-h-0",
            }}
        >
            <DrawerContent>
                <DrawerHeader>
                    Set Targets
                </DrawerHeader>
                <DrawerBody>
                    {targetDrafts.map((_, targetIndex) =>
                        <div key={`target-${targetIndex}`} className="flex flex-col gap-2 shrink-0">
                            {renderTargetRow(targetIndex)}
                            <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={() => removeTarget(targetIndex)}
                            >
                                Remove Target
                            </Button>
                            <Divider/>
                        </div>)}
                    <Button
                        className="shrink-0"
                        size="md"
                        variant="solid"
                        color="primary"
                        isDisabled={cannotAddTarget}
                        onPress={addTarget}
                    >
                        Add Target
                    </Button>
                    <div className="flex justify-center mt-4">
                        <Button
                            className="shrink-0"
                            size="md"
                            variant="flat"
                            color="default"
                            onPress={() => handleDrawerOpenChange(false)}
                        >
                            Done
                        </Button>
                    </div>
                </DrawerBody>
                <DrawerFooter>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    </>
}