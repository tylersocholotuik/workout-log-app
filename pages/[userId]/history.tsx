import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { Spinner } from "@nextui-org/react";
import WorkoutList from "@/components/history/WorkoutList";

import { getWorkouts } from "@/utils/api/workouts";

import { Workout } from "@/utils/models/models";

export default function History() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [groupByOption, setGroupByOption] = useState("week");

    const router = useRouter();

    const { userId } = router.query;

    useEffect(() => {
        if (userId) {
            loadWorkouts(userId);
        }
        if (workouts) {
            console.log(groupWorkoutsBy("week"));
        }
    }, [router.isReady]);

    const loadWorkouts = async (userId: string | string[] | undefined) => {
        setError("");

        try {
            const data = await getWorkouts(userId);
            setWorkouts(data);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                setError(error.message);
            }
        }
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

    if (isLoading) {
        return (
            <div className="flex justify-center pt-6">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-2 md:px-4 py-6">
            <WorkoutList workouts={workouts} />
        </div>
    );
}
