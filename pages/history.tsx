import { useEffect, useState } from "react";

import Head from "next/head";

import { Spinner, useDisclosure } from "@nextui-org/react";
import WorkoutList from "@/components/history/WorkoutList";
import FeedbackModal from "@/components/workout/FeedbackModal";

import { getWorkouts } from "@/utils/api/workouts";

import { Workout } from "@/utils/models/models";

import { useAuth } from "@/components/auth/AuthProvider";

export default function History() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const errorModal = useDisclosure();

    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadWorkouts(user.id);
        }
    }, [user]);

    useEffect(() => {
        if (error !== "") {
            errorModal.onOpen();
        }
    }, [error]);

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
            <>
                <Head>
                    <title>Workout History</title>
                    <meta
                    property="description"
                    content="View your past workouts filtered by date range, and grouped by month or week."
                />
                </Head>
                <main>
                    <div className="absolute top-1/2 left-2/4 -translate-x-1/2 -translate-y-1/2">
                        <Spinner size="lg" />
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Head>
                <title>Workout History</title>
            </Head>
            <main>
                <div className="container mx-auto px-2 md:px-4 py-6">
                    <h2 className="text-center text-xl mb-2">
                        Workout History
                    </h2>
                    <WorkoutList workouts={workouts} />
                </div>
            </main>

            <FeedbackModal 
                isOpen={errorModal.isOpen}
                onOpenChange={errorModal.onOpenChange}
                color="text-red-500"
                title="Error"
                message={error}
                setError={setError}
                setFeedback={undefined}
            />
        </>
    );
}
