import { useState } from "react";
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

import { useAuth } from "./auth/AuthProvider";

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const router = useRouter();

    const { user, isSignedIn } = useAuth();

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
                console.error(`Error during logout: ${error.message}`);
            } else {
                localStorage.clear();
                router.push("/");
            }
        } catch (err) {
            console.error(`Unexpected error during logout: ${err}`);
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
                                    href={item.path.replace("[workoutId]", "new-workout")}
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
                    {user && (
                        <NavbarMenuItem className="hidden lg:flex">
                            <div className="flex items-center gap-1">
                                <Icon icon="mdi:user" width="16" height="16" />
                                <p className="text-sm">
                                    {user.user_metadata.display_name ??
                                        user.email}
                                </p>
                            </div>
                        </NavbarMenuItem>
                    )}
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
                                href={item.path.replace("[workoutId]", "new-workout")}
                                size="sm"
                            >
                                {item.name}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                    {user && (
                        <NavbarMenuItem className="mt-4">
                            <div className="flex items-center gap-1">
                                <Icon icon="mdi:user" width="16" height="16" />
                                <p className="text-sm">
                                    {user.user_metadata.display_name ??
                                        user.email}
                                </p>
                            </div>
                        </NavbarMenuItem>
                    )}
                    {!isSignedIn() ? (
                        <NavbarMenuItem>
                            <Link color="foreground" href="/login">
                                Login
                            </Link>
                        </NavbarMenuItem>
                    ) : (
                        <NavbarMenuItem>
                            <Link color="danger" onPress={logOut}>
                                Logout
                            </Link>
                        </NavbarMenuItem>
                    )}
                </NavbarMenu>
            </Navbar>
        </>
    );
}
