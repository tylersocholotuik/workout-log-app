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
} from "@nextui-org/react";

import { Icon } from "@iconify/react/dist/iconify.js";

import DarkModeSwitch from "./DarkModeSwitch";

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const router = useRouter();

    useEffect(() => {
        isUserLoggedIn();
    }, [isLoggedIn]);

    const isUserLoggedIn = async () => {
        const {
            data: { session },
        } = await supabase.auth.getSession();

        if (session) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }
    };

    const menuItems = [
        {
            name: "Workout",
            path: "/[userId]/workout/[workoutId]",
            icon: (
                <Icon icon="arcticons:my-workout-plan" width="24" height="24" />
            ),
        },
        {
            name: "History",
            path: "/[userId]/history",
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

    // setting userId until authentication is implemented
    const userId = "b24993de-ff97-4547-87d0-9997638c319b";

    const isActive = (path: string): boolean => {
        return router.pathname.includes(path);
    };

    const logOut = async () => {
        try {
            // Refresh the session
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
                console.warn("Error refreshing session:", refreshError);
            }
    
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error during logout:", error);
            } else {
                console.log("Logout successful");
                setIsLoggedIn(false);
                localStorage.clear();
            }
        } catch (e) {
            console.error("Unexpected error during logout:", e);
        }
    };

    return (
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

            <NavbarContent className="hidden sm:flex gap-4" justify="center">
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
                                    .replace("[userId]", `${userId}`)
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
                {!isLoggedIn ? (
                    <NavbarItem className="hidden lg:flex">
                        <Link href="/login">Login</Link>
                    </NavbarItem>
                ) : (
                    <NavbarItem className="hidden lg:flex">
                        <Button color="danger" variant="light" onPress={logOut}>
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
                                isActive(item.path) ? undefined : "foreground"
                            }
                            aria-current={
                                isActive(item.path) ? "page" : undefined
                            }
                            href={item.path
                                .replace("[userId]", `${userId}`)
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
    );
}
