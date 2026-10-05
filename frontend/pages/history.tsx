import Head from "next/head";

import { useQuery } from "@tanstack/react-query";

import { Spinner } from "@heroui/react";
import WorkoutList from "@/components/history/WorkoutList";

import { getWorkouts } from "@/lib/api/workouts";

export default function History() {
  
  const { data: workouts, isLoading } = useQuery({ queryKey: ["workouts"], queryFn: getWorkouts });

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
          <h2 className="text-center text-xl mb-2">Workout History</h2>
          <WorkoutList workouts={workouts} />
        </div>
      </main>
    </>
  );
}
