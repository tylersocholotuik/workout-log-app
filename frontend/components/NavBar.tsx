import {useState, JSX} from "react";
import {useRouter} from "next/router";

import {
    Navbar,
    NavbarBrand,
    NavbarMenuToggle,
    NavbarMenuItem,
    NavbarMenu,
    NavbarContent,
    NavbarItem,
    Link,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    DropdownTrigger,
    useDisclosure,
    Avatar,
    User,
} from "@heroui/react";

import {Icon} from "@iconify/react/dist/iconify.js";

import ConfirmationModal from "@/components/shared/ConfirmationModal";

import {useAuth} from "./auth/AuthProvider";

import {useMediaQuery} from "react-responsive";

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const router = useRouter();

    const {user, isSignedIn, isLoading, logout} = useAuth();

    const logoutModal = useDisclosure();
    
    const isMobile = useMediaQuery({ query: '(max-width: 639px)' });
    
    const iconSize = isMobile ? 16 : 20;

    const isActive = (path: string): boolean => {
        // ensure home page is not active on every page
        if (path === "/") {
            return router.pathname === "/"
        }
        return router.pathname.includes(path);
    };
    
    const menuItems = [
        {
            name: "Workout",
            path: "/workout/[workoutId]",
            icon: (
                <Icon icon="arcticons:my-workout-plan" width={iconSize} height={iconSize}/>
            ),
        },
        {
            name: "History",
            path: "/history",
            icon: (
                <Icon icon="material-symbols:history" width={iconSize} height={iconSize}/>
            ),
        },
        {
            name: "Calculator",
            path: "/calculator",
            icon: <Icon icon="mdi:calculator" width={iconSize} height={iconSize}/>,
        },
    ];
    
    const renderDropdownItems = () => {
        if (!isSignedIn()) {
            return (
                <DropdownItem
                    key="login"
                    onPress={() => router.push("/login")}
                    startContent={
                        <Icon
                            icon="mdi:login"
                            width="16"
                            height="16"
                        />
                    }
                >
                    Login
                </DropdownItem>
            );
        } else {
            return (
                <>
                    <DropdownItem
                        key="account"
                        onPress={() => router.push("/account")}
                        startContent={
                            <Icon
                                icon="mdi:account"
                                width="16"
                                height="16"
                            />
                        }
                    >
                        Account
                    </DropdownItem>
                    <DropdownItem
                        key="logout"
                        color="danger"
                        className="text-danger"
                        onPress={logoutModal.onOpen}
                        startContent={
                            <Icon
                                icon="mdi:logout"
                                width="16"
                                height="16"
                            />
                        }
                    >
                        Logout
                    </DropdownItem>
                </>
            );
        }
    }
    
    const renderNavbarLink = (item: { name: string; path: string; icon: JSX.Element }, size: "sm" | "md") => {
        return (
            <Link
                className="w-full flex items-center gap-1"
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
                onPress={() => setIsMenuOpen(false)}
                size={size}
            >
                {item.icon}
                {item.name}
            </Link>
        )
    }

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
                                {renderNavbarLink(item, "md")}
                            </NavbarItem>
                        );
                    })}
                </NavbarContent>

                <NavbarContent justify="end">
                    {/* Prevent Login flash while user is fetched from the server */}
                    {isLoading ? null :
                        <>
                            <NavbarItem className="hidden md:flex">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <User
                                            aria-label="User Actions"
                                            className="hover:cursor-pointer"
                                            avatarProps={{
                                                size: "sm",
                                                src: "",
                                                showFallback: true,
                                            }}
                                            name={user?.displayName ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`}
                                            description={user?.email ?? ""}
                                        />
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="Static Actions"
                                    >
                                        {renderDropdownItems()}
                                    </DropdownMenu>
                                </Dropdown>
                            </NavbarItem>
                            <NavbarItem className="md:hidden">
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Avatar
                                            aria-label="User Actions"
                                            className="hover:cursor-pointer"
                                            size="sm"
                                            src=""
                                            showFallback
                                            name={`${user?.firstName.charAt(0).toUpperCase() ?? ""}${user?.lastName.charAt(0).toUpperCase() ?? ""}`}
                                        />
                                    </DropdownTrigger>
                                    <DropdownMenu
                                        aria-label="User Actions"
                                    >
                                        {renderDropdownItems()}
                                    </DropdownMenu>
                                </Dropdown>
                            </NavbarItem>
                        </>
                    }
                </NavbarContent>

                <NavbarMenu>
                    <NavbarMenuItem>
                        <Link
                            className="w-full flex items-center gap-1"
                            color={isActive("/") ? undefined : "foreground"}
                            aria-current={isActive("/") ? "page" : undefined}
                            href="/"
                            onPress={() => setIsMenuOpen(false)}
                            size="sm"
                        >
                            <Icon
                                icon="mdi:home"
                                width={iconSize}
                                height={iconSize}
                            />
                            Home
                        </Link>
                    </NavbarMenuItem>
                    {menuItems.map((item, index) => (
                        <NavbarMenuItem key={`${item}-${index}`}>
                            {renderNavbarLink(item, "sm")}
                        </NavbarMenuItem>
                    ))}
                </NavbarMenu>
            </Navbar>

            <ConfirmationModal
                isOpen={logoutModal.isOpen}
                onOpenChange={logoutModal.onOpenChange}
                headerText="Logout"
                bodyText="Are you sure you want to logout?"
                confirmButtonText="Logout"
                confirmButtonColor="danger"
                confirmFunction={logout}
            />
        </>
    );
}
