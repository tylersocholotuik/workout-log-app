import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/utils/supabase/supabaseClient";

import {
    Navbar,
    NavbarBrand,
    NavbarMenuToggle,
    NavbarMenuItem,
    NavbarMenu,
    NavbarContent,
    NavbarItem,
    Link,
    Button,
    useDisclosure,
} from "@nextui-org/react";

import { Icon } from "@iconify/react/dist/iconify.js";

import DarkModeSwitch from "./DarkModeSwitch";
import FeedbackModal from "./workout/FeedbackModal";

import { useAuth } from "./auth/AuthProvider";

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [error, setError] = useState("");

    const router = useRouter();

    const { user, isSignedIn } = useAuth();

    const feedbackModal = useDisclosure();

    useEffect(() => {
        if (feedback !== "" || error !== "") {
            feedbackModal.onOpen();
        }
    }, [feedback, error]);

    const menuItems = [
        {
            name: "Workout",
            path: "/workout/[workoutId]",
            icon: (
                <Icon icon="arcticons:my-workout-plan" width="24" height="24" />
            ),
        },
        {
            name: "History",
            path: "/history",
            icon: (
                <Icon icon="material-symbols:history" width="24" height="24" />
            ),
        },
        {
            name: "Calculator",
            path: "/calculator",
            icon: <Icon icon="mdi:calculator" width="24" height="24" />,
        },
    ];

    const isActive = (path: string): boolean => {
        return router.pathname.includes(path);
    };

    const logOut = async () => {
        try {
            // Refresh the session
            const { error: refreshError } =
                await supabase.auth.refreshSession();
            if (refreshError) {
                console.warn("Error refreshing session:", refreshError);
            }

            const { error } = await supabase.auth.signOut();
            if (error) {
                setError(`Error during logout: ${error.message}`);
            } else {
                setFeedback("Logout successful");
                // setIsLoggedIn(false);
                localStorage.clear();
                router.push("/");
            }
        } catch (e) {
            setError(`Unexpected error during logout: ${e}`);
        }
    };

    return (
        <>
            <Navbar
                maxWidth="full"
                isBordered
                shouldHideOnScroll
                isMenuOpen={isMenuOpen}
                onMenuOpenChange={setIsMenuOpen}
            >
                <NavbarContent className="sm:hidden" justify="start">
                    <NavbarMenuToggle
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    />
                </NavbarContent>

                <NavbarContent className="sm:hidden pr-3" justify="center">
                    <NavbarBrand>
                        <Link href="/" color="foreground">
                            <p className="font-bold text-inherit">EZLog</p>
                        </Link>
                    </NavbarBrand>
                </NavbarContent>

                <NavbarContent className="hidden sm:flex">
                    <Link href="/" color="foreground">
                        <p className="font-bold text-inherit">EZLog</p>
                    </Link>
                </NavbarContent>

                <NavbarContent
                    className="hidden sm:flex gap-4"
                    justify="center"
                >
                    {menuItems.map((item) => {
                        return (
                            <NavbarItem
                                key={item.name}
                                isActive={isActive(item.path)}
                            >
                                <Link
                                    color={
                                        isActive(item.path)
                                            ? undefined
                                            : "foreground"
                                    }
                                    aria-current={
                                        isActive(item.path) ? "page" : undefined
                                    }
                                    href={item.path
                                        .replace("[workoutId]", "0")}
                                    showAnchorIcon
                                    anchorIcon={item.icon}
                                >
                                    {item.name}
                                </Link>
                            </NavbarItem>
                        );
                    })}
                </NavbarContent>

                <NavbarContent justify="end">
                    {!isSignedIn() ? (
                        <NavbarItem className="hidden sm:flex">
                            <Link href="/login">Login</Link>
                        </NavbarItem>
                    ) : (
                        <NavbarItem className="hidden sm:flex">
                            <Button
                                color="danger"
                                variant="light"
                                onPress={logOut}
                            >
                                Logout
                            </Button>
                        </NavbarItem>
                    )}
                    <NavbarItem>
                        <DarkModeSwitch />
                    </NavbarItem>
                </NavbarContent>

                <NavbarMenu>
                    {menuItems.map((item, index) => (
                        <NavbarMenuItem key={`${item}-${index}`}>
                            <Link
                                className="w-full"
                                color={
                                    isActive(item.path)
                                        ? undefined
                                        : "foreground"
                                }
                                aria-current={
                                    isActive(item.path) ? "page" : undefined
                                }
                                href={item.path
                                    .replace("[workoutId]", "0")}
                                size="sm"
                            >
                                {item.name}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                    <NavbarMenuItem>
                        <Link color="foreground" href="/login">
                            Login
                        </Link>
                    </NavbarMenuItem>
                    <NavbarMenuItem>
                        <Link color="danger" onPress={logOut}>
                            Logout
                        </Link>
                    </NavbarMenuItem>
                </NavbarMenu>
            </Navbar>

            <FeedbackModal 
                isOpen={feedbackModal.isOpen}
                onOpenChange={feedbackModal.onOpenChange}
                title={
                    feedback !== ""
                        ? "Success"
                        : error !== ""
                        ? "Error"
                        : ""
                }
                message={
                    feedback !== "" ? feedback : error !== "" ? error : ""
                }
                color={error !== "" ? "red-600" : "inherit"}
                setFeedback={setFeedback}
                setError={setError}
            />
        </>
    );
}
