import { useState, useEffect, createContext, useContext } from "react";

import { useRouter } from "next/router";

import { supabase } from "@/utils/supabase/supabaseClient";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
    authorizeUser: () => void,
    user: User | null,
    isSignedIn: () => boolean
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

export default function AuthProvider({ children }) {
    const [user, setUser] = useState<User | null>(null);

    const router = useRouter();

    const protectedPages = [
        "/workout/[workoutId]",
        "/history"
    ];

    // listen for changes to the auth state to set user
    // dynamically. 
    useEffect(() => {
        const { data } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === "INITIAL_SESSION") {
                    setUser(session?.user ?? null);
                } else if (event === "SIGNED_IN") {
                    setUser(session?.user ?? null);
                } else if (event === "SIGNED_OUT") {
                    setUser(null);
                }
            }
        );

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // if the user is not logged in and they try to access a protected page
                // redirect to login page
                if (protectedPages.includes(router.pathname)) {
                    router.push("/login");
                }
            }

            setUser(session?.user ?? null);
        });

        return () => data.subscription.unsubscribe();
    }, []);

    const authorizeUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // redirect to login page if not logged in
            router.push("/login");
        } else {
            setUser(session.user);
        }
    };

    const isSignedIn = () => user !== null;
    
    return (
        <AuthContext.Provider value={{authorizeUser, user, isSignedIn}}>
            {children}
        </AuthContext.Provider>
    );
}