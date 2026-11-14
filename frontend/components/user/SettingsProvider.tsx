import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { UserSettings } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { getUserSettings } from "@/lib/api/users";

export const userSettingsQueryKey = (userId?: string) => ["userSettings", userId];

interface SettingsContextType {
    settings: UserSettings | null,
    isLoading: boolean,
}

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};

export default function SettingsProvider({ children }: SettingsProviderProps) {

    const { user } = useAuth();
    const { setTheme } = useTheme();

    const queryKey = userSettingsQueryKey(user?.id);

    const { data: settings = null, isLoading } = useQuery({
        queryKey,
        queryFn: getUserSettings,
        enabled: !!user,
    });
    
    // Update the theme when the user settings load or change
    useEffect(() => {
        if (settings) {
            setTheme(settings.theme);
        }
    }, [settings, setTheme]);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                isLoading,
            }}
        >
            {children}
        </SettingsContext.Provider>
    )
}