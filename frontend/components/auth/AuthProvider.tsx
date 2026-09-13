import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/router";
import { User } from "@/types";
import { logout as logoutAuth, fetchCurrentUser } from "@/lib/api/auth";

interface AuthContextType {
    user: User | null,
    isSignedIn: () => boolean,
    isLoading: boolean,
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
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const protectedPages = useMemo(
        () => [
            "/workout/[workoutId]",
            "/history"
        ],
        []
    );

    // Check for user on mount and route changes
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await fetchCurrentUser();
                setUser(currentUser);

                // If not logged in and on a protected page, redirect to login
                if (!currentUser && protectedPages.includes(router.pathname)) {
                    await router.push("/login");
                }
            } finally {
                // Runs after every call (mount + each route change), but
                // since isLoading only ever starts at true and is never set
                // back to true afterward, this just confirms "the check has
                // resolved at least once" - it won't cause any flicker on
                // later route changes.
                setIsLoading(false);
            }
        };

        checkAuth();
        // router is intentionally omitted: Next.js's Pages Router returns a
        // new router object on every render (see makePublicRouterInstance
        // in next/dist/client/router.js), so including it here would cause
        // setUser to run on every render, triggering an infinite render loop.
        // Only router.pathname (a primitive) should trigger this effect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.pathname, protectedPages]);

    const refreshUser = async () => {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
    };

    const logout = async () => {
        await logoutAuth();
        setUser(null);
        await router.push("/login");
    };

    const isSignedIn = () => user !== null;
    
    return (
        <AuthContext.Provider value={{user, isSignedIn, isLoading, logout, refreshUser}}>
            {children}
        </AuthContext.Provider>
    );
}