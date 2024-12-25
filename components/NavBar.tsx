import { useState } from "react";
import { useRouter } from "next/router";

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

import DarkModeSwitch from "./DarkModeSwitch";

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const menuItems = [
    { name: "Workout", path: "/[userId]/workout/[workoutId]" },
    { name: "History", path: "/[userId]/history" },
    { name: "Calculator", path: "/calculator" },
  ];

  // setting userId until authentication is implemented
  const userId = "cm4zr6sti0000priwve9whn6t";

  const isActive = (path: string): boolean => {
    return router.pathname.includes(path);
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
            <NavbarItem key={item.name} isActive={isActive(item.path)}>
              <Link
                color={isActive(item.path) ? undefined : "foreground"}
                aria-current={isActive(item.path) ? "page" : undefined}
                href={item.path
                  .replace("[userId]", `${userId}`)
                  .replace("[workoutId]", "0")}
              >
                {item.name}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden lg:flex">
          <Link href="#">Login</Link>
        </NavbarItem>
        <NavbarItem>
          <Button as={Link} color="primary" href="#" variant="flat">
            Sign Up
          </Button>
        </NavbarItem>
        <NavbarItem>
          <DarkModeSwitch />
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link className="w-full" color="foreground" href="#" size="sm">
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
