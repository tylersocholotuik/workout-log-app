import { getLocalTimeZone, parseDate, today } from "@internationalized/date";

export const getTodayWorkoutDate = () => today(getLocalTimeZone()).toString();

export const parseWorkoutDate = (date: string) => parseDate(date);

export const workoutDateToLocalDate = (date: string) => {
    const calendarDate = parseWorkoutDate(date);
    return calendarDate.toDate(getLocalTimeZone());
};

export const formatWorkoutDate = (
    date: string,
    options: Intl.DateTimeFormatOptions
) => workoutDateToLocalDate(date).toLocaleDateString("en-CA", options);
