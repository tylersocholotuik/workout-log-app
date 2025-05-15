import { useState } from "react";

import {
  RadioGroup,
  Radio,
  DateRangePicker,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  RangeValue,
} from "@heroui/react";

import { Icon } from "@iconify/react/dist/iconify.js";

import {
  parseDate,
  DateValue,
  toZoned,
  getLocalTimeZone,
} from "@internationalized/date";

import WorkoutCard from "./WorkoutCard";

import { Workout } from "@/utils/models/models";

interface WorkoutListProps {
  workouts: Workout[];
}

export default function WorkoutList({ workouts }: WorkoutListProps) {
  // workouts are in descending order by date
  const firstWorkoutDate = workouts[workouts.length - 1]?.date ?? new Date();
  // Parse dates to CalendarDate object to be used in Next UI
  // date range picker. parseDate function needs an ISO string with
  // time removed
  const firstWorkoutDateString = parseDate(
    new Date(firstWorkoutDate).toISOString().split("T")[0]
  );
  const lastWorkoutDate = workouts[0]?.date ?? new Date();
  const lastWorkoutDateString = parseDate(
    new Date(lastWorkoutDate).toISOString().split("T")[0]
  );

  const [groupByOption, setGroupByOption] = useState("none");
  const [dateRange, setDateRange] = useState<RangeValue<DateValue> | null>({
    start: toZoned(firstWorkoutDateString, getLocalTimeZone()),
    end: toZoned(lastWorkoutDateString, getLocalTimeZone()),
  } as RangeValue<DateValue>);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>(workouts);

  const filterWorkoutsByDateRange = (
    workouts: Workout[],
    dateRange: RangeValue<DateValue> | null
  ) => {
    setDateRange(dateRange);

    const workoutsInRange = workouts.filter((workout) => {
      const workoutDate = toZoned(
        parseDate(new Date(workout.date).toISOString().split("T")[0]),
        getLocalTimeZone()
      );
      return workoutDate >= dateRange!.start && workoutDate <= dateRange!.end;
    });

    setFilteredWorkouts(workoutsInRange);
  };

  type GroupedWorkouts = Workout[] | Partial<Record<string, Workout[]>>;

  // groups the workouts by month or week depending on the provided option
  const groupWorkoutsBy = (workouts: Workout[], option: string): GroupedWorkouts => {
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

    return workouts;
  };

  // sets date range back to the range of the first workout to last workout
  const resetDateRange = () => {
    const dateRange = {
      start: toZoned(firstWorkoutDateString, getLocalTimeZone()),
      end: toZoned(lastWorkoutDateString, getLocalTimeZone()),
    };

    filterWorkoutsByDateRange(workouts, dateRange);
  };

  const groupedWorkouts = groupWorkoutsBy(filteredWorkouts, groupByOption);

  return (
    <section>
      <div className="flex justify-center items-center gap-2"></div>
      <div className="flex justify-center mb-6">
        <Popover placement="bottom">
          <PopoverTrigger>
            <Button
              color="primary"
              variant="light"
              size="md"
              startContent={
                <Icon icon="system-uicons:filtering" width="21" height="21" />
              }
            >
              Filering/Grouping
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <p className="mb-4">Filtering/grouping options</p>
            <div className="flex flex-col gap-4 items-center mb-4">
              <div className="flex flex-col items-center gap-2">
                <div>
                  <DateRangePicker
                    label="Select date range"
                    showMonthAndYearPickers
                    pageBehavior="single"
                    variant="bordered"
                    size="md"
                    color="primary"
                    value={dateRange}
                    onChange={(newValue) =>
                      filterWorkoutsByDateRange(workouts, newValue)
                    }
                  />
                </div>
                <div>
                  <Button
                    color="primary"
                    size="sm"
                    variant="solid"
                    onPress={resetDateRange}
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <div className="">
                <RadioGroup
                  label="Group workouts by"
                  orientation="vertical"
                  value={groupByOption}
                  onValueChange={setGroupByOption}
                  classNames={{
                    base: "",
                  }}
                >
                  <Radio value="none">None</Radio>
                  <Radio value="month">Month</Radio>
                  <Radio value="week">Week</Radio>
                </RadioGroup>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {filteredWorkouts.length === 0 && (
        <p className="text-center pt-6 text-gray-400 italic text-lg">
          No Workouts
        </p>
      )}
      {groupByOption === "none" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 justify-center">
          {filteredWorkouts.map((workout) => {
            return <WorkoutCard key={workout.id} workout={workout} />;
          })}
        </div>
      ) : (
        <div>
          {groupedWorkouts && typeof groupedWorkouts === "object" && !Array.isArray(groupedWorkouts) &&
      Object.keys(groupedWorkouts).map((key) => {
        return (
          <section key={key} className="mb-6">
            <h3 className="text-center mb-6">{key}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(groupedWorkouts[key] ?? []).map((workout: Workout) => {
                return <WorkoutCard key={workout.id} workout={workout} />;
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
