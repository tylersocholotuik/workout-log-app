import { useState, createContext, useContext } from "react";

import { useRouter } from "next/router";

import { supabase } from "@/utils/supabase/supabaseClient";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
    authorizeUser: () => void,
    user: User
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
    const [user, setUser] = useState({});

    const router = useRouter();

    const authorizeUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // redirect to login page if not logged in
            router.push("/login");
        } else {
            setUser(session.user);
        }
    };
    
    return (
        <AuthContext.Provider value={{authorizeUser, user}}>
            {children}
        </AuthContext.Provider>
    );
}