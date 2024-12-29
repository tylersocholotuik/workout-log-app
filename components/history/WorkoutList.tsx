import { useState } from "react";

import { RadioGroup, Radio } from "@nextui-org/react";

import WorkoutCard from "./WorkoutCard";

import { Workout } from "@/utils/models/models";

export default function WorkoutList({ workouts }) {
    const [groupByOption, setGroupByOption] = useState("none");

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

    const groupedWorkouts = groupWorkoutsBy(workouts, groupByOption);

    return (
        <section>
            <h2 className="text-center text-xl mb-6">Workout History</h2>
            <div className="flex justify-center mb-6">
                <RadioGroup
                    label="Group workouts by"
                    orientation="horizontal"
                    value={groupByOption}
                    onValueChange={setGroupByOption}
                    classNames={{
                        base: "text-center"
                    }}
                >
                    <Radio value="none">None</Radio>
                    <Radio value="month">Month</Radio>
                    <Radio value="week">Week</Radio>
                </RadioGroup>
            </div>
            {workouts.length === 0 && (
                <p className="text-center pt-6 text-gray-400 italic text-lg">
                    No Workouts
                </p>
            )}
            {groupByOption === "none" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {workouts.map((workout) => {
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
