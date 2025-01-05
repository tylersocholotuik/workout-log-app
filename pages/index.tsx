import { useEffect, useState } from "react";

import { useTheme } from "next-themes";

import Head from "next/head";
import Footer from "@/components/Footer";

import {
    Image,
    Card,
    CardBody,
    Link,
    Button
} from "@nextui-org/react";

import calculator_dark from "/public/img/calculator_dark.webp";
import calculator_light from "/public/img/calculator_light.webp";
import history_dark from "/public/img/history_dark.webp";
import history_light from "/public/img/history_light.webp";
import workout_dark from "/public/img/workout_dark.webp";
import workout_light from "/public/img/workout_light.webp";
import select_exercise_dark from "/public/img/select_exercise_dark.webp";
import select_exercise_light from "/public/img/select_exercise_light.webp";

export default function Home() {
    const { resolvedTheme } = useTheme();
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        // checks the current theme. Using this to change the card
        // images based on the theme.
        console.log()
        setIsDarkMode(resolvedTheme === "dark");
    }, [resolvedTheme]);

    return (
        <>
            <Head>
                <title>workout.log&#40;&#41; | Home</title>
            </Head>
            <main>
                <div className="container mx-auto px-2 md:px-4 py-6">
                    <section className="max-w-[800px] justify-self-center mb-16">
                        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl mb-8">
                            Welcome to{" "}
                            <span className="tracking-widest font-mono">
                                <span className="text-[#569CD6] dark:text-[#9CDCFE]">workout</span>.
                                <span className="text-amber-500 dark:text-[#DCDCAA]">
                                    log
                                </span>
                                <span className="font-bold text-[#da70d6]">
                                    &#40;&#41;
                                </span>
                            </span>
                        </h2>
                        <p className="text-md sm:text-lg text-center text-foreground-500">
                            A simple training log app to help your track your
                            progress in the gym!
                        </p>
                    </section>
                    <div className="max-w-[1000px] mx-auto mb-8">
                        <section className="mb-8">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8">
                                Create a New Workout
                            </h3>
                            <Card className="p-2 mb-6">
                                <CardBody>
                                    <div className="flex flex-col-reverse items-center md:flex-row gap-8">
                                        <div className="md:w-3/6">
                                            {isDarkMode ? (
                                                <Image
                                                    src={select_exercise_dark.src}
                                                    alt="Image of workout exercise selection"
                                                    radius="lg"
                                                />
                                            ) : (
                                                <Image
                                                    src={
                                                        select_exercise_light.src
                                                    }
                                                    alt="Image of workout exercise selection"
                                                    radius="lg"
                                                />
                                            )}
                                        </div>
                                        <section className="text-center md:text-start md:w-3/6">
                                            <h4 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4">
                                                Add Exercises
                                            </h4>
                                            <p className="text-md sm:text-xl md:text-2xl text-foreground-500 font-thin">
                                                Choose from a list of pre-loaded
                                                exercises, or create your own.
                                            </p>
                                        </section>
                                    </div>
                                </CardBody>
                            </Card>
                            <Card className="p-2">
                                <CardBody>
                                    <div className="flex flex-col-reverse items-center md:flex-row gap-8">
                                        <div className="md:w-3/6">
                                            {isDarkMode ? (
                                                <Image
                                                    src={workout_dark.src}
                                                    alt="Image of the workout creation page"
                                                    radius="lg"
                                                />
                                            ) : (
                                                <Image
                                                    src={workout_light.src}
                                                    alt="Image of the workout creation page"
                                                    radius="lg"
                                                />
                                            )}
                                        </div>
                                        <section className="text-center md:text-start md:w-3/6">
                                            <h4 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4">
                                                Enter Data
                                            </h4>
                                            <p className="text-md sm:text-xl md:text-2xl text-foreground-500 font-thin">
                                                Enter exercise notes and the
                                                weight lifted, reps completed,
                                                and the Rate of Perceived
                                                Exertion for each of your sets.
                                            </p>
                                        </section>
                                    </div>
                                </CardBody>
                            </Card>
                        </section>
                        <section className="mb-8">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8">
                                Exercise History
                            </h3>
                            <Card className="p-2 mb-6">
                                <CardBody>
                                    <div className="flex flex-col-reverse items-center md:flex-row gap-8">
                                        <div className="md:w-3/6">
                                            {isDarkMode ? (
                                                <Image
                                                    src={history_dark.src}
                                                    alt="Image of the workout history page"
                                                    radius="lg"
                                                />
                                            ) : (
                                                <Image
                                                    src={history_light.src}
                                                    alt="Image of the workout history page"
                                                    radius="lg"
                                                />
                                            )}
                                        </div>
                                        <section className="text-center md:text-start md:w-3/6">
                                            <h4 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4">
                                                View Past Workouts
                                            </h4>
                                            <p className="text-md sm:text-xl md:text-2xl text-foreground-500 font-thin">
                                                Filter by date range, and group
                                                by month or week.
                                            </p>
                                        </section>
                                    </div>
                                </CardBody>
                            </Card>
                        </section>
                        <section className="mb-8">
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8">
                                Calculator
                            </h3>
                            <Card className="p-2 mb-6">
                                <CardBody>
                                    <div className="flex flex-col-reverse items-center md:flex-row gap-8">
                                        <div className="md:w-3/6">
                                            {isDarkMode ?
                                                <Image
                                                src={calculator_dark.src}
                                                alt="Image of the calculator page"
                                                radius="lg"
                                            />
                                            :
                                            <Image
                                                src={calculator_light.src}
                                                alt="Image of the calculator page"
                                                radius="lg"
                                            />
                                        }
                                        </div>
                                        <section className="text-center md:text-start md:w-3/6">
                                            <h4 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4">
                                                Calculate Your Estimated One-Rep
                                                Max
                                            </h4>
                                            <p className="text-md sm:text-xl md:text-2xl text-foreground-500 font-thin mb-8">
                                                Enter the weight, reps, and RPE
                                                for a set you have performed,
                                                and get your estimated 1RM along
                                                with estimated weights for
                                                different rep and RPE ranges.
                                            </p>
                                            <div className="justify-self-center">
                                                <Button 
                                                    as={Link} 
                                                    href="/calculator"
                                                    variant="solid"
                                                    size="lg"
                                                    color="primary"
                                                 >
                                                    Try it out!
                                                </Button>
                                            </div>
                                        </section>
                                    </div>
                                </CardBody>
                            </Card>
                        </section>
                        <p className="text-xl sm:text-2xl md:text-3xl text-center py-8">
                            Interested? <Link className="text-xl sm:text-2xl md:text-3xl" href="/login">Sign up now!</Link>
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
