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
    Dropdown,
    DropdownMenu,
    DropdownItem,
    DropdownTrigger,
    useDisclosure,
} from "@heroui/react";

import { Icon } from "@iconify/react/dist/iconify.js";
import { ChevronDownIcon } from "@/icons/ChevronDownIcon";

import DarkModeSwitch from "./DarkModeSwitch";
import LogoutModal from "./LogoutModal";

import { useAuth } from "./auth/AuthProvider";

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const router = useRouter();

    const { user, isSignedIn } = useAuth();

    const logoutModal = useDisclosure();

    const menuItems = [
        {
            name: "Workout",
            path: "/workout/[workoutId]",
            icon: (
                <Icon icon="arcticons:my-workout-plan" width="28" height="28" />
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
        // ensure home page is not active on every page
        if (path === "/") {
            return router.pathname === "/"
        }
        return router.pathname.includes(path);
    };

    const logOut = async () => {

        try {
            // scope: "local" means only sign out on the current device
            const { error } = await supabase.auth.signOut({ scope: "local"});
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
                            <p className="text-lg tracking-widest font-mono">
                            <span className="tracking-widest font-mono">
                                <span className="text-[#569CD6] dark:text-[#9CDCFE]">workout</span>.
                                <span className="text-amber-500 dark:text-[#DCDCAA]">
                                    log
                                </span>
                                <span className="font-bold text-[#da70d6]">
                                    &#40;&#41;
                                </span>
                            </span>
                            </p>
                        </Link>
                    </NavbarBrand>
                </NavbarContent>

                <NavbarContent className="hidden sm:flex">
                    <Link href="/" color="foreground">
                        <p className="text-xl tracking-widest font-mono">
                        <span className="tracking-widest font-mono">
                                <span className="text-[#569CD6] dark:text-[#9CDCFE]">workout</span>.
                                <span className="text-amber-500 dark:text-[#DCDCAA]">
                                    log
                                </span>
                                <span className="font-bold text-[#da70d6]">
                                    &#40;&#41;
                                </span>
                            </span>
                        </p>
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
                                    size="md"
                                    color={
                                        isActive(item.path)
                                            ? undefined
                                            : "foreground"
                                    }
                                    aria-current={
                                        isActive(item.path) ? "page" : undefined
                                    }
                                    href={item.path.replace(
                                        "[workoutId]",
                                        "new-workout"
                                    )}
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
                        <>
                            <NavbarItem className="hidden md:flex">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            aria-label="User Actions"
                                            variant="light"
                                            size="sm"
                                            startContent={
                                                <Icon
                                                    icon="mdi:user"
                                                    width="16"
                                                    height="16"
                                                />
                                            }
                                            endContent={<ChevronDownIcon />}
                                        >
                                            {user?.user_metadata.display_name ??
                                                user?.email}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Static Actions"
                                        disabledKeys={["account"]}
                                    >
                                        <DropdownItem
                                            key="account"
                                            description="Currently unavailable"
                                        >
                                            Manage account
                                        </DropdownItem>
                                        <DropdownItem
                                            key="logout"
                                            color="danger"
                                            className="text-danger"
                                            onPress={logoutModal.onOpen}
                                        >
                                            Logout
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </NavbarItem>
                            <NavbarItem className="hidden sm:flex md:hidden">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button
                                            aria-label="User Actions"
                                            variant="light"
                                            size="sm"
                                            isIconOnly
                                        >
                                            <Icon
                                                icon="mdi:user"
                                                width="16"
                                                height="16"
                                            />
                                            <ChevronDownIcon />
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="User Actions"
                                        disabledKeys={["account"]}
                                    >
                                        <DropdownItem
                                            key="account"
                                            description="Currently unavailable"
                                        >
                                            Manage account
                                        </DropdownItem>
                                        <DropdownItem
                                            key="logout"
                                            color="danger"
                                            className="text-danger"
                                            onPress={logoutModal.onOpen}
                                        >
                                            Logout
                                        </DropdownItem>
                                    </DropdownMenu>
                                </Dropdown>
                            </NavbarItem>
                        </>
                    )}
                    <NavbarItem>
                        <DarkModeSwitch />
                    </NavbarItem>
                </NavbarContent>

                <NavbarMenu>
                    <NavbarMenuItem>
                        <Link
                            className="w-full"
                            color={isActive("/") ? undefined : "foreground"}
                            aria-current={isActive("/") ? "page" : undefined}
                            href="/"
                            size="sm"
                        >
                            Home
                        </Link>
                    </NavbarMenuItem>
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
                                href={item.path.replace(
                                    "[workoutId]",
                                    "new-workout"
                                )}
                                size="sm"
                            >
                                {item.name}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                    {!isSignedIn() ? (
                        <NavbarMenuItem>
                            <Link color="foreground" href="/login">
                                Login
                            </Link>
                        </NavbarMenuItem>
                    ) : (
                        <>
                            <NavbarMenuItem className="mt-4">
                                <div className="flex items-center gap-1">
                                    <Icon
                                        icon="mdi:user"
                                        width="16"
                                        height="16"
                                    />
                                    <p className="text-sm">
                                        {user?.user_metadata.display_name ??
                                            user?.email}
                                    </p>
                                </div>
                            </NavbarMenuItem>
                            <NavbarMenuItem>
                                <Link
                                    className="hover:cursor-pointer"
                                    color="foreground"
                                    size="sm"
                                    isDisabled
                                >
                                    Manage account
                                </Link>
                            </NavbarMenuItem>
                            <NavbarMenuItem>
                                <Link
                                    className="hover:cursor-pointer"
                                    color="danger"
                                    size="sm"
                                    onPress={logoutModal.onOpen}
                                >
                                    Logout
                                </Link>
                            </NavbarMenuItem>
                        </>
                    )}
                </NavbarMenu>
            </Navbar>

            <LogoutModal 
                isOpen={logoutModal.isOpen}
                onOpenChange={logoutModal.onOpenChange}
                logOutFunction={logOut}
            />
        </>
    );
}
