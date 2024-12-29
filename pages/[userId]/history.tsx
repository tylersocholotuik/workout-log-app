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

    const router = useRouter();

    const { userId } = router.query;

    useEffect(() => {
        if (userId) {
            loadWorkouts(userId);
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
