import { useEffect, useState } from "react";

import { RadioGroup, Radio, DateRangePicker, Switch } from "@nextui-org/react";

import { parseDate, CalendarDate } from "@internationalized/date";

import WorkoutCard from "./WorkoutCard";

import { Workout } from "@/utils/models/models";

export default function WorkoutList({ workouts }) {
    const [groupByOption, setGroupByOption] = useState("none");
    const [dateRange, setDateRange] = useState({
        start: parseDate(new Date().toISOString().split("T")[0]),
        end: parseDate(new Date().toISOString().split("T")[0]),
    });
    const [filteredWorkouts, setFilteredWorkouts] =
        useState<Workout[]>(workouts);
    const [useFilter, setUseFilter] = useState(false);

    useEffect(() => {
        if (!useFilter) {
            setFilteredWorkouts(workouts);
        } else {
            filterWorkoutsByDateRange(workouts, dateRange);
        }
    }, [useFilter, dateRange]);

    const filterWorkoutsByDateRange = (
        workouts: Workout[],
        dateRange: { start: CalendarDate; end: CalendarDate }
    ) => {
        setDateRange(dateRange);

        const workoutsInRange = workouts.filter((workout) => {
            const workoutDate = parseDate(
                new Date(workout.date).toISOString().split("T")[0]
            );
            return (
                workoutDate >= dateRange.start && workoutDate <= dateRange.end
            );
        });

        setFilteredWorkouts(workoutsInRange);
    };

    // groups the workouts by month or week depending on the provided option
    const groupWorkoutsBy = (workouts: Workout[], option: string) => {
        if (option === "none") {
            return workouts;
        }
        if (option === "month") {
            // Creates an object with keys that are the workout date's
            // month and year as a string
            return Object.groupBy(workouts, ({ date }) =>
                new Date(date).toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                })
            );
        }
        if (option === "week") {
            const getWeekStartDate = (date: Date) => {
                const startDate = new Date(date);
                const day = startDate.getDay();
                // gets the day of the month of the Sunday in the week
                // of the workout date e.g. December 28 is Saturday (numeric value 6)
                // 28 - 6 = Sunday, December 22
                const diff = startDate.getDate() - day;
                startDate.setDate(diff);
                return startDate;
            };

            const getWeekEndDate = (startDate: Date) => {
                const endDate = new Date(startDate);
                // add 6 days to start of the week to get the end of the week (Saturday)
                endDate.setDate(endDate.getDate() + 6);
                return endDate;
            };

            // Create an object with keys that are strings of the date range
            // (December 22, 2024 - December 28, 2024)
            return Object.groupBy(workouts, ({ date }) => {
                const startDate = getWeekStartDate(new Date(date));
                const endDate = getWeekEndDate(startDate);

                return `${startDate.toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })} - ${endDate.toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })}`;
            });
        }
    };

    const groupedWorkouts = groupWorkoutsBy(filteredWorkouts, groupByOption);

    return (
        <section>
            <h2 className="text-center text-xl mb-6">Workout History</h2>
            <div className="flex flex-col gap-8 items-center justify-center mb-6">
                <div className="flex flex-col items-center gap-2">
                    <div>
                        <Switch
                            isSelected={useFilter}
                            onValueChange={setUseFilter}
                            size="sm"
                        >
                            Filter by date range
                        </Switch>
                    </div>
                    {useFilter && (
                        <div>
                            <DateRangePicker
                                label="Select date range"
                                showMonthAndYearPickers
                                visibleMonths={3}
                                pageBehavior="single"
                                variant="bordered"
                                size="md"
                                color="primary"
                                value={dateRange}
                                onChange={(newValue) =>
                                    filterWorkoutsByDateRange(
                                        workouts,
                                        newValue
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
                <div className="">
                    <RadioGroup
                        label="Group workouts by"
                        orientation="horizontal"
                        value={groupByOption}
                        onValueChange={setGroupByOption}
                        classNames={{
                            base: "text-center",
                        }}
                    >
                        <Radio value="none">None</Radio>
                        <Radio value="month">Month</Radio>
                        <Radio value="week">Week</Radio>
                    </RadioGroup>
                </div>
            </div>
            {filteredWorkouts.length === 0 && (
                <p className="text-center pt-6 text-gray-400 italic text-lg">
                    No Workouts
                </p>
            )}
            {groupByOption === "none" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 justify-center">
                    {filteredWorkouts.map((workout) => {
                        return (
                            <WorkoutCard key={workout.id} workout={workout} />
                        );
                    })}
                </div>
            ) : (
                <div>
                    {Object.keys(groupedWorkouts).map((key) => {
                        return (
                            <section key={key} className="mb-6">
                                <h3 className="text-center mb-6">{key}</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {groupedWorkouts[key].map((workout) => {
                                        return (
                                            <WorkoutCard
                                                key={workout.id}
                                                workout={workout}
                                            />
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
