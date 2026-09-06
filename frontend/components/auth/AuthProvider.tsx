import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/router";
import { User } from "@/types";
import { getUserFromToken, logout as logoutAuth } from "@/lib/api/auth";

interface AuthContextType {
    authorizeUser: () => void,
    user: User | null,
    isSignedIn: () => boolean,
    logout: () => void,
    refreshUser: () => void
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error(
            "useAuth must be used within an AuthProvider"
        );
    }
    return context;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    const protectedPages = [
        "/workout/[workoutId]",
        "/history"
    ];

    // Check for user on mount and route changes
    useEffect(() => {
        const checkAuth = () => {
            const currentUser = getUserFromToken();
            setUser(currentUser);

            // If not logged in and on a protected page, redirect to login
            if (!currentUser && protectedPages.includes(router.pathname)) {
                router.push("/login");
            }
        };

        checkAuth();
    }, [router.pathname]);

    const refreshUser = () => {
        const currentUser = getUserFromToken();
        setUser(currentUser);
    };

    const authorizeUser = async () => {
        const currentUser = getUserFromToken();

        if (!currentUser) {
            router.push("/login");
        } else {
            setUser(currentUser);
        }
    };

    const logout = () => {
        logoutAuth();
        setUser(null);
        router.push("/login");
    };

    const isSignedIn = () => user !== null;
    
    return (
        <AuthContext.Provider value={{authorizeUser, user, isSignedIn, logout, refreshUser}}>
            {children}
        </AuthContext.Provider>
    );
}