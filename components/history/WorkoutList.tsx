import WorkoutCard from "./WorkoutCard";

export default function WorkoutList({ workouts }) {
  return (
    <section>
      <h2 className="text-center text-xl mb-6">Workout History</h2>
      {workouts.length === 0 && (
        <p className="text-center pt-6 text-gray-400 italic text-lg">
          No Workouts
        </p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {workouts.map((workout) => {
          return <WorkoutCard key={workout.id} workout={workout} />;
        })}
      </div>
    </section>
  );
}
