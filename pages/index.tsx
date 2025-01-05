import Head from "next/head";

import {
    Image,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
} from "@nextui-org/react";

import workout from "/public/img/workout-full-screen.png";
import workout_mobile from "/public/img/workout-mobile.png";
import select_exercise from "/public/img/select-exercise.png";

export default function Home() {
    return (
        <>
            <Head>
                <title>workout.log&#40;&#41; | Home</title>
            </Head>
            <main>
                <div className="container mx-auto px-2 md:px-4 py-6">
                    <section className="max-w-[800px] justify-self-center mb-16">
                        <h2 className="text-center text-xl mb-8">
                            Welcome to{" "}
                            <span className="text-2xl tracking-widest font-mono">
                                workout.<span className="font-bold">log</span>
                                <span className="font-bold">&#40;&#41;</span>
                            </span>
                        </h2>
                        <p className="text-lg text-foreground-500">
                            A simple training log app to help your track your
                            progress in the gym!
                        </p>
                    </section>
                    <section>
                        <Card>
                            <CardHeader className="text-xl justify-center">
                                <h2 className="text-xl text-center">
                                    Create a New Workout
                                </h2>
                            </CardHeader>
                            <CardBody>
                                <div className="flex flex-col md:flex-row gap-8">
                                  <div>
                                    <Image
                                        src={select_exercise.src}
                                        alt="Image of the workout creation page"
                                        height={500}
                                    />
                                  </div>
                                  <div className="text-lg">
                                    <p>Choose from a list of pre-loaded exercises, or create your own exercises.</p>
                                  </div>
                                </div>
                            </CardBody>
                            <CardFooter></CardFooter>
                        </Card>
                    </section>
                </div>
            </main>
        </>
    );
}
