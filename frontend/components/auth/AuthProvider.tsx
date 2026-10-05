import { useEffect, useMemo, createContext, useContext, ReactNode } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";
import { logout as logoutAuth, fetchCurrentUser } from "@/lib/api/auth";

const CURRENT_USER_QUERY_KEY = ["currentUser"];

interface AuthContextType {
    user: User | null,
    isSignedIn: () => boolean,
    isLoading: boolean,
    logout: () => void,
    refreshUser: (updatedUser?: User | null) => void
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
    const router = useRouter();
    const queryClient = useQueryClient();

    const protectedPages = useMemo(
        () => [
            "/workout/[workoutId]",
            "/history"
        ],
        []
    );
    
    const { data: user = null, isLoading, refetch } = useQuery({
        queryKey: CURRENT_USER_QUERY_KEY,
        queryFn: fetchCurrentUser,
    });
    
    useEffect(() => {
        const verifyAuth = async () => {
            const { data: currentUser } = await refetch();

            if (!currentUser && protectedPages.includes(router.pathname)) {
                await router.push("/login");
            }
        };

        verifyAuth();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.pathname, protectedPages, refetch]);

    // Accepts an optional, already-known User (e.g. the response from
    // login/register) to write straight into the cache - avoiding a
    // redundant GET /api/auth/me. Called with no arguments, it falls back
    // to invalidating so the next read refetches from the server.
    const refreshUser = async (updatedUser?: User | null) => {
        if (updatedUser !== undefined) {
            queryClient.setQueryData(CURRENT_USER_QUERY_KEY, updatedUser);
            return;
        }
        await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    };

    const logout = async () => {
        await logoutAuth();
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
        await router.push("/login");
    };

    const isSignedIn = () => user !== null;
    
    return (
        <AuthContext.Provider value={{user, isSignedIn, isLoading, logout, refreshUser}}>
            {children}
        </AuthContext.Provider>
    );
}