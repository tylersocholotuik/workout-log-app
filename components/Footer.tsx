import { Button, Link } from "@nextui-org/react";

import { Icon } from "@iconify/react/dist/iconify.js";

export default function Footer() {
    return (
        <footer className="border-t border-divider p-4">
            <div className="container mx-auto flex flex-col md:flex-row items-center gap-4 md:justify-between">
                <div className="text-center md:text-start">
                    <p className="text-xl sm:text-2xl md:text-3xl">
                        <span className="tracking-widest font-mono">
                            <span className="text-[#569CD6] dark:text-[#9CDCFE]">
                                workout
                            </span>
                            .
                            <span className="text-amber-500 dark:text-[#DCDCAA]">
                                log
                            </span>
                            <span className="font-bold text-[#da70d6]">
                                &#40;&#41;
                            </span>
                        </span>
                    </p>
                    <p className="text-sm text-foreground-500 mb-4 md:mb-2">
                        &copy; Copyright 2025 Tyler Socholotuik
                    </p>
                    <div className="max-w-[500px]">
                        <p className="text-md md:text-lg text-center md:text-start">
                            Disclaimer
                        </p>
                        <p className="text-sm sm:text-md text-start text-foreground-500">
                            This application is a portfolio project and is
                            intended for demonstration. I will not profit from
                            any ideas that are borrowed from exisiting
                            applications.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-md sm:text-lg">Contact</p>
                        <Button
                            as={Link}
                            size="md"
                            color="default"
                            variant="light"
                            href="mailto:socholotuikt@gmail.com"
                            startContent={
                                <Icon
                                    icon="ic:outline-email"
                                    width="24"
                                    height="24"
                                />
                            }
                        >
                            Email
                        </Button>
                    </div>
                    <div className="text-center">
                        <p className="text-md sm:text-lg">Project</p>
                        <Button
                            as={Link}
                            size="md"
                            color="default"
                            variant="light"
                            href="https://github.com/tylersocholotuik/workout-log-app"
                            isExternal
                            startContent={
                                <Icon
                                    icon="mdi:github"
                                    width="24"
                                    height="24"
                                />
                            }
                        >
                            Repository
                        </Button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
