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

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();

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
        await supabase.auth.signOut();
    }

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
                <NavbarItem className="flex">
                    <Link href="/login">Login</Link>
                </NavbarItem>
                <NavbarItem>
                    <Button color="danger" onPress={logOut} variant="flat">
                        Logout
                    </Button>
                </NavbarItem>
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
            </NavbarMenu>
        </Navbar>
    );
}
