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

import {Dispatch, SetStateAction, useMemo, useRef, useState} from "react";

import {WorkoutExercise, SetTargets} from "@/types";
import {deriveAppliesToAllSets} from "@/components/workout/ExerciseCard";

import {handleInputChange, sanitizeDisplayValues} from "@/utils/inputHandlers";

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
}

// null -> empty string for display, same as SetsTableRow
const toDraftStrings = (target: SetTargets): TargetDraftStrings => ({
    targetRepsMin: target.targetRepsMin !== null ? String(target.targetRepsMin) : "",
    targetRepsMax: target.targetRepsMax !== null ? String(target.targetRepsMax) : "",
    targetEffortMin: target.targetEffortMin !== null ? String(target.targetEffortMin) : "",
    targetEffortMax: target.targetEffortMax !== null ? String(target.targetEffortMax) : "",
});

// empty string -> null, the reverse of toDraftStrings
const parseTargetDraft = (draft: TargetDraftStrings) => ({
    targetRepsMin: draft.targetRepsMin !== "" ? parseInt(draft.targetRepsMin) : null,
    targetRepsMax: draft.targetRepsMax !== "" ? parseInt(draft.targetRepsMax) : null,
    targetEffortMin: draft.targetEffortMin !== "" ? parseFloat(draft.targetEffortMin) : null,
    targetEffortMax: draft.targetEffortMax !== "" ? parseFloat(draft.targetEffortMax) : null,
});

export default function TargetsDrawer({
                                          isOpen,
                                          onOpenChange,
                                          exercise,
                                          exerciseIndex
                                      }: TargetsDrawerProps) {
    const {targets, effortType} = useWorkoutExercise();
    const {setWorkout} = useWorkoutContext();

    const effortTypeLabel = useMemo(() => {
        return effortType === "rpe" ? "RPE" : "RIR";
    }, [effortType]);

    // reps: whole numbers 0-9999; effort: 0-10, 0.5 steps for RPE, whole for RIR
    const REPS_REGEX = /^(?:[0-9]{1,4})?$/;
    const REPS_MIN = 0;
    const REPS_MAX = 9999;
    const RPE_REGEX = /^(10|[0-9](\.\d{0,1})?)?$/;
    const RIR_REGEX = /^(10|[0-9])?$/;
    const effortRegex = effortType === "rpe" ? RPE_REGEX : RIR_REGEX;
    const EFFORT_MIN = 0;
    const EFFORT_MAX = 10;
    const effortIsInteger = effortType === "rir";

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

    // guards against the "Apply to all" Checkbox's onValueChange firing twice for a
    // single tap, a known React/WebKit quirk on mobile Safari and Chrome (iOS). Only
    // the first dispatch per physical tap is honored; any duplicate arriving before
    // the next paint is dropped, regardless of which value it reports.
    const applyToAllTapInFlightRef = useRef(false);

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
        ]);

        const targetRepsMin = draft.targetRepsMin !== "" ? parseInt(draft.targetRepsMin) : null;
        let targetRepsMax = draft.targetRepsMax !== "" ? parseInt(draft.targetRepsMax) : null;
        const targetEffortMin = draft.targetEffortMin !== "" ? parseFloat(draft.targetEffortMin) : null;
        let targetEffortMax = draft.targetEffortMax !== "" ? parseFloat(draft.targetEffortMax) : null;

        // ensure min <= max for both reps and effort; if not, set max = min and update draft strings
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

        const setIndices = Array.from(selectedSetsByTarget[targetIndex]);

        setWorkout((prevWorkout) => ({
            ...prevWorkout,
            exercises: prevWorkout.exercises.map((ex, eIndex) =>
                eIndex === exerciseIndex
                    ? {
                        ...ex,
                        sets: ex.sets.map((set, sIndex) =>
                            setIndices.includes(sIndex)
                                ? {...set, targetRepsMin, targetRepsMax, targetEffortMin, targetEffortMax}
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

        const {targetRepsMin, targetRepsMax, targetEffortMin, targetEffortMax} =
            parseTargetDraft(targetDrafts[targetIndex]);

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
                                };
                            }
                            if (removed.includes(sIndex)) {
                                return {
                                    ...set,
                                    targetRepsMin: null,
                                    targetRepsMax: null,
                                    targetEffortMin: null,
                                    targetEffortMax: null,
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
        // mobile Safari/Chrome (iOS) can dispatch this handler twice for a single tap.
        // Only the first dispatch per tap is honored; drop any duplicate that arrives
        // before the next paint, whatever value it reports.
        if (applyToAllTapInFlightRef.current) {
            return;
        }
        applyToAllTapInFlightRef.current = true;
        requestAnimationFrame(() => {
            applyToAllTapInFlightRef.current = false;
        });

        const previousIndices = selectedSetsByTarget[targetIndex];
        const newIndices = checked
            ? new Set(exercise.sets.map((_, setIndex) => setIndex))
            : previousIndices;
        const added = Array.from(newIndices).filter((i) => !previousIndices.has(i));

        setSelectedSetsByTarget((prev) =>
            prev.map((s, i) => (i === targetIndex ? newIndices : s))
        );

        const {targetRepsMin, targetRepsMax, targetEffortMin, targetEffortMax} =
            parseTargetDraft(targetDrafts[targetIndex]);

        setWorkout((prevWorkout) => ({
            ...prevWorkout,
            exercises: prevWorkout.exercises.map((ex, eIndex) =>
                eIndex === exerciseIndex
                    ? {
                        ...ex,
                        targetAppliesToAllSets: checked,
                        sets: ex.sets.map((set, sIndex) =>
                            added.includes(sIndex)
                                ? {...set, targetRepsMin, targetRepsMax, targetEffortMin, targetEffortMax}
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
                                }
                                : set
                        ),
                    }
                    : ex
            ),
        }));
    }

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
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                                <div className="flex gap-2 col-span-2">
                                    <Input
                                        label="Min Reps"
                                        labelPlacement="outside"
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
                                    <Input
                                        label="Max Reps"
                                        labelPlacement="outside"
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
                                <div className="flex gap-2 col-span-2">
                                    <Input
                                        label={`Min ${effortTypeLabel}`}
                                        labelPlacement="outside"
                                        size="sm"
                                        value={targetDrafts[targetIndex].targetEffortMin}
                                        inputMode="decimal"
                                        onValueChange={(value) => {
                                            handleInputChange({
                                                value,
                                                regex: effortRegex,
                                                isInteger: effortIsInteger,
                                                minValue: EFFORT_MIN,
                                                maxValue: EFFORT_MAX,
                                                setter: makeDraftSetter(targetIndex, "targetEffortMin"),
                                            });
                                        }}
                                        onBlur={() => commitTargetDraft(targetIndex)}
                                    />
                                    <Input
                                        label={`Max ${effortTypeLabel}`}
                                        labelPlacement="outside"
                                        size="sm"
                                        value={targetDrafts[targetIndex].targetEffortMax}
                                        inputMode="decimal"
                                        onValueChange={(value) => {
                                            handleInputChange({
                                                value,
                                                regex: effortRegex,
                                                isInteger: effortIsInteger,
                                                minValue: EFFORT_MIN,
                                                maxValue: EFFORT_MAX,
                                                setter: makeDraftSetter(targetIndex, "targetEffortMax"),
                                            });
                                        }}
                                        onBlur={() => commitTargetDraft(targetIndex)}
                                    />
                                </div>
                                <div className="flex flex-col gap-2 col-span-1">
                                    <Checkbox
                                        size="sm"
                                        isSelected={appliesToAllByTarget[targetIndex]}
                                        isDisabled={!canApplyToAllByTarget[targetIndex]}
                                        onValueChange={(checked) => handleApplyToAllChange(targetIndex, checked)}
                                    >
                                        Apply to all
                                    </Checkbox>
                                    {!appliesToAllByTarget[targetIndex] &&
                                        <Select
                                            label="Apply to Sets"
                                            labelPlacement="outside"
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
                                    }
                                </div>
                            </div>
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