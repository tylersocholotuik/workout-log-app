import {useState, useMemo} from "react";

import { useQuery } from "@tanstack/react-query";

import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    Divider,
    Textarea,
    RadioGroup,
    Radio,
    Popover,
    PopoverTrigger,
    PopoverContent,
    Tooltip,
    Switch,
    useDisclosure,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/react";

import { Icon } from "@iconify/react";
import { DeleteIcon } from "@/icons/DeleteIcon";

import SetsTable from "./SetsTable";

import {
    Exercise,
    WorkoutExercise,
    EffortRatingType,
    SetTargets,
} from "@/types";

import { createEmptySet } from "@/lib/factories";

import SelectExerciseDrawer from "./SelectExerciseDrawer";
import ExerciseHistoryModal from "./ExerciseHistoryModal";
import TargetsDrawer from "@/components/workout/TargetsDrawer";
import WorkoutExerciseProvider from "@/components/workout/WorkoutExerciseProvider";

import { useWorkoutContext } from "@/pages/workout/[workoutId]";

import { calculateOneRepMax, convertEffortRating } from "@/utils/calculator/calculator";


import {getExerciseHistory} from "@/lib/api/workouts";

// Groups each set's target values into SetTargets entries so that sets
// sharing identical targets can be edited together via a multi-select
// input. Derived fresh from `sets` on every call so it's always in sync
// (set added/removed, etc.) rather than being a separate, driftable copy.
// Sets with no target values at all are omitted entirely.
function deriveTargets(sets: WorkoutExercise["sets"]): SetTargets[] {
    const targets: SetTargets[] = [];

    sets.forEach((set, setIndex) => {
        const {
            targetRepsMin,
            targetRepsMax,
            targetEffortMin,
            targetEffortMax,
        } = set;

        if (
            targetRepsMin === null &&
            targetRepsMax === null &&
            targetEffortMin === null &&
            targetEffortMax === null
        ) {
            return;
        }

        const existing = targets.find(
            (target) =>
                target.targetRepsMin === targetRepsMin &&
                target.targetRepsMax === targetRepsMax &&
                target.targetEffortMin === targetEffortMin &&
                target.targetEffortMax === targetEffortMax
        );

        if (existing) {
            existing.setIndices.push(setIndex);
        } else {
            targets.push({
                setIndices: [setIndex],
                targetRepsMin,
                targetRepsMax,
                targetEffortMin,
                targetEffortMax,
            });
        }
    });

    return targets;
}

// exercise.targetAppliesToAllSets isn't persisted to the backend, so loaded
// workouts won't have it set. In that case, fall back to inferring it from
// whether a single target currently covers every set.
export function deriveAppliesToAllSets(exercise: WorkoutExercise, targets: SetTargets[]): boolean {
    if (exercise.targetAppliesToAllSets !== undefined) {
        return exercise.targetAppliesToAllSets;
    }
    return exercise.sets.length > 0 && targets.length === 1 && targets[0].setIndices.length === exercise.sets.length;
}

interface ExerciseCardProps {
    exercise: WorkoutExercise;
    exerciseIndex: number;
}

export default function ExerciseCard({
    exercise,
    exerciseIndex,
}: ExerciseCardProps) {
    const { workout, setWorkout } = useWorkoutContext();

    const [notes, setNotes] = useState(exercise.notes);
    const [weightUnit, setWeightUnit] = useState(exercise.weightUnit.toString());
    const [effortType, setEffortType] = useState(exercise.effortType.toString());
    const [showOneRepMax, setShowOneRepMax] = useState(true);
    const [showTargets, setShowTargets] = useState(true);
    const targets = useMemo(() => deriveTargets(exercise.sets), [exercise.sets]);

    const changeExerciseDrawer = useDisclosure();
    const exerciseHistoryModal = useDisclosure();
    const targetsDrawer = useDisclosure();

    // determine best set that has between 1-10 reps and RPE >= 6 or RIR <= 4
    // this rule is due to there only being data for these values
    // see utils/calculator/rpeData.ts
    const oneRepMax = useMemo(() => {
        const eligibleSets = exercise.sets.filter((set) => {
            // must explicitly check for as 0 is falsy
            if (
                set.weight != null &&
                set.reps != null &&
                set.effortRating != null
            ) {
                return exercise.effortType === "rpe"
                    ? set.reps >= 1 && set.reps <= 10 && set.effortRating >= 6
                    : set.reps >= 1 && set.reps <= 10 && set.effortRating <= 4;
            }
        });

        if (eligibleSets.length > 0) {
            // calculate e1RM for each set and use the highest value
            const maxList = eligibleSets.map((set) => {
                return calculateOneRepMax({
                    weight: set.weight!, 
                    reps: set.reps!, 
                    effortType: exercise.effortType, 
                    effortRating: set.effortRating!
                });
            });

            return Math.max(...maxList);
        }

        return null;
    }, [exercise.sets, exercise.effortType]);

    const addSet = () => {
        // if "apply to all sets" is on for a target, carry its values onto the new set too
        const uniformTargets = deriveTargets(exercise.sets);
        const inheritedTarget =
            deriveAppliesToAllSets(exercise, uniformTargets) && uniformTargets.length === 1
                ? uniformTargets[0]
                : null;

        const newSet = {
            ...createEmptySet(),
            ...(inheritedTarget && {
                targetRepsMin: inheritedTarget.targetRepsMin,
                targetRepsMax: inheritedTarget.targetRepsMax,
                targetEffortMin: inheritedTarget.targetEffortMin,
                targetEffortMax: inheritedTarget.targetEffortMax,
            }),
        };

        // creating a deep copy of workout, then adding a new set
        // to the exercise at the current exercise index
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                          ...exercise,
                          sets: [...exercise.sets, newSet],
                      }
                    : exercise
            ),
        };
        setWorkout(updatedWorkout);
    };

    const deleteExercise = () => {
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.filter((_, i) => i !== exerciseIndex),
        };
        setWorkout(updatedWorkout);
    };

    const changeExercise = (
        newExercise: Exercise,
        exerciseIndex?: number
    ) => {
        // create deep copy of workout
        let updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise) => ({
                ...exercise,
                sets: exercise.sets.map((set) => ({
                    ...set,
                })),
            })),
        };

        // Update the exercise
        updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                          ...exercise,
                          exercise: newExercise,
                          exerciseId: newExercise.id,
                          sets: exercise.sets.map((set) => ({
                              ...set,
                          })),
                      }
                    : exercise
            ),
        };

        setWorkout(updatedWorkout);
    };

    const saveInputChange = (
        exerciseIndex: number,
        field: string,
        value: string
    ) => {
        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((exercise, index) =>
                index === exerciseIndex
                    ? {
                          ...exercise,
                          [field]: value,
                      }
                    : exercise
            ),
        };
        
        setWorkout(updatedWorkout);
    };

    // Switching effort type requires converting all existing effort ratings to the new type.
    // When converting from RPE to RIR, we round up to the nearest whole number before converting.
    // The downside of this is when converting back to RPE, the original RPE value is lost (if it was x.5)
    const handleEffortTypeChange = (value: string) => {
        // RadioGroup only emits "rpe" or "rir".
        const newValue = value as EffortRatingType;

        setEffortType(newValue);

        const updatedWorkout = {
            ...workout,
            exercises: workout.exercises.map((ex, index) =>
                index === exerciseIndex
                    ? {
                          ...ex,
                          effortType: newValue,
                          sets: ex.sets.map((set) => {
                                const updatedSet = { ...set };
                                if (set.effortRating !== null) {
                                    updatedSet.effortRating = convertEffortRating(set.effortRating);
                                }
                                if (set.targetEffortMin !== null) {
                                    if (set.targetEffortMax !== null) {
                                        updatedSet.targetEffortMin = convertEffortRating(set.targetEffortMax);    
                                    } else {
                                        updatedSet.targetEffortMin = null;
                                    }
                                }
                                if (set.targetEffortMax !== null) {
                                    if (set.targetEffortMin !== null) {
                                        updatedSet.targetEffortMax = convertEffortRating(set.targetEffortMin);
                                    } else {
                                        updatedSet.targetEffortMax = null;
                                    }
                                }
                                return updatedSet;
                              }
                          ),
                      }
                    : ex
            ),
        };

        setWorkout(updatedWorkout);
    };

    // gets a list including the date, notes, and sets for the selected exercise
    // for each time the user performed that exercise.
    const { data: exerciseHistory = [], isLoading: isLoadingExerciseHistory } = useQuery({
        queryKey: ["exerciseHistory", exercise.exerciseId],
        queryFn: () => getExerciseHistory(exercise.exerciseId),
    });
    
    return (
        <>
            <WorkoutExerciseProvider showTargets={showTargets} targets={targets} effortType={effortType}>
                <Card classNames={{ footer: "justify-center py-2" }}>
                    <CardHeader className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <h3 className="text-md text-primary">
                                {exercise.exercise.name}
                            </h3>
                            <div>
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            aria-label="Actions"
                                            variant="light"
                                            size="sm"
                                            isIconOnly
                                        >
                                            <Tooltip content="Actions" offset={12}>
                                                <Icon
                                                    icon="tabler:dots"
                                                    width="16"
                                                    height="16"
                                                />
                                            </Tooltip>
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Static Actions">
                                        <DropdownItem
                                            key="change"
                                            onPress={changeExerciseDrawer.onOpen}
                                            startContent={
                                                <Icon
                                                    icon="material-symbols:change-circle-rounded"
                                                    width="18"
                                                    height="18"
                                                />
                                            }
                                        >
                                            Change exercise
                                        </DropdownItem>
                                        <DropdownItem
                                            key="history"
                                            onPress={exerciseHistoryModal.onOpen}
                                            startContent={
                                                <Icon
                                                    icon="material-symbols:history"
                                                    width="18"
                                                    height="18"
                                                />
                                            }
                                        >
                                            Exercise history
                                        </DropdownItem>
                                        <DropdownItem
                                            key="targets"
                                            onPress={targetsDrawer.onOpenChange}
                                            startContent={<Icon
                                                icon="boxicons:target"
                                                width="18"
                                                height="18"
                                            />}
                                        >
                                            Set targets
                                        </DropdownItem>
                                        <DropdownItem
                                            key="delete"
                                            color="danger"
                                            className="text-danger"
                                            onPress={deleteExercise}
                                            startContent={<DeleteIcon />}
                                        >
                                            Delete exercise
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </div>
                        </div>
                        <div className="flex gap-1 items-center">
                            <Popover showArrow offset={10} placement="left-start">
                                <PopoverTrigger>
                                    <Button
                                        aria-label="exercise options"
                                        isIconOnly
                                        color="default"
                                        variant="light"
                                        size="sm"
                                    >
                                        <Tooltip content="Options">
                                            <Icon
                                                icon="material-symbols:settings"
                                                width="16"
                                            />
                                        </Tooltip>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[240px]">
                                    {(titleProps) => (
                                        <div className="px-1 py-2 w-full">
                                            <p
                                                className="text-small font-bold text-foreground mb-2"
                                                {...titleProps}
                                            >
                                                Options
                                            </p>
                                            <div className="flex flex-col gap-4 w-full mb-4">
                                                <RadioGroup
                                                    size="sm"
                                                    label="Weight Unit"
                                                    id={`exercise-${exerciseIndex}-weight-unit`}
                                                    orientation="horizontal"
                                                    value={weightUnit}
                                                    onValueChange={(newValue) => {
                                                        setWeightUnit(newValue);
                                                        saveInputChange(
                                                            exerciseIndex,
                                                            "weightUnit",
                                                            newValue
                                                        );
                                                    }}
                                                >
                                                    <Radio value="lbs">lbs</Radio>
                                                    <Radio value="kg">kg</Radio>
                                                </RadioGroup>
                                                <RadioGroup
                                                    size="sm"
                                                    label="Effort Rating Type"
                                                    id={`exercise-${exerciseIndex}-effort-type`}
                                                    orientation="vertical"
                                                    value={effortType}
                                                    onValueChange={handleEffortTypeChange}
                                                >
                                                    <Radio
                                                        value="rpe" 
                                                        description="Rate of Perceived Exertion"
                                                    >
                                                        RPE
                                                    </Radio>
                                                    <Radio 
                                                        value="rir" 
                                                        description="Reps In Reserve"
                                                    >
                                                        RIR
                                                    </Radio>
                                                </RadioGroup>
                                            </div>
                                            <div className="mb-2">
                                                <Switch
                                                    size="sm"
                                                    isSelected={showOneRepMax}
                                                    onValueChange={setShowOneRepMax}
                                                >
                                                    Show e1RM
                                                </Switch>
                                            </div>
                                            <div>
                                                <Switch
                                                    size="sm"
                                                    isSelected={showTargets}
                                                    onValueChange={setShowTargets}
                                                >
                                                    Show Targets
                                                </Switch>
                                            </div>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardHeader>
                    <Divider />
                    <CardBody className="pt-0">
                        <Textarea
                            className="mb-4"
                            label="Notes"
                            id={`exercise-${exerciseIndex}-notes`}
                            minRows={1}
                            maxRows={3}
                            maxLength={100}
                            variant="underlined"
                            value={notes}
                            onValueChange={setNotes}
                            onBlur={() =>
                                saveInputChange(exerciseIndex, "notes", notes)
                            }
                        />
                        <SetsTable
                            sets={exercise.sets}
                            weightUnit={exercise.weightUnit}
                            effortType={exercise.effortType}
                            exerciseIndex={exerciseIndex}
                        />
                        {oneRepMax && showOneRepMax && (
                            <div className="flex justify-center mt-4">
                                <Tooltip
                                    content="Estimated one-rep max"
                                    placement="bottom"
                                >
                                    <p className="text-default-500 text-sm">
                                        e1RM:{" "}
                                        <span className="text-default-800 dark:text-white">
                                            {oneRepMax} {exercise.weightUnit}
                                        </span>
                                    </p>
                                </Tooltip>
                            </div>
                        )}
                    </CardBody>
                    <CardFooter>
                        <Button color="primary" variant="light" onPress={addSet}>
                            Add Set
                        </Button>
                    </CardFooter>
                </Card>
    
                <SelectExerciseDrawer
                    isOpen={changeExerciseDrawer.isOpen}
                    onOpenChange={changeExerciseDrawer.onOpenChange}
                    callbackFunction={changeExercise}
                    exerciseIndex={exerciseIndex}
                    update={true}
                />
    
                <ExerciseHistoryModal
                    isOpen={exerciseHistoryModal.isOpen}
                    onOpenChange={exerciseHistoryModal.onOpenChange}
                    exerciseHistory={exerciseHistory}
                    isLoading={isLoadingExerciseHistory}
                    exerciseName={
                        exercise.exercise.name
                    }
                />
                
                <TargetsDrawer
                    isOpen={targetsDrawer.isOpen}
                    onOpenChange={targetsDrawer.onOpenChange}
                    exercise={exercise}
                    exerciseIndex={exerciseIndex}
                />
            </WorkoutExerciseProvider>
        </>
    );
}
