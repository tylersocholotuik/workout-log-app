import { User, RegisterData, LoginData, AuthResponse, ResetPasswordData } from '@/types';
import { extractErrorMessage } from './apiErrors';
import { apiFetch } from './client';
import { saveToken, getToken, removeToken, getAuthHeaders } from './tokenStorage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5258';

// Re-exported so existing imports from "./auth" keep working unchanged.
export { saveToken, getToken, removeToken, getAuthHeaders };

export const getUserFromToken = (): User | null => {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            removeToken();
            return null;
        }

        return {
            id: payload.sub,
            email: payload.email,
            firstName: payload.given_name,
            lastName: payload.family_name,
            displayName: payload.preferred_username || null,
            isAdmin: payload.is_admin === 'True' || payload.is_admin === true
        };
    } catch (error) {
        console.error('Error parsing token:', error);
        removeToken();
        return null;
    }
};

// Auth API calls
export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const res = await apiFetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, 'Failed to register'));
    }

    const response: AuthResponse = await res.json();
    saveToken(response.token);
    return response;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
    const res = await apiFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, 'Failed to login'));
    }

    const response: AuthResponse = await res.json();
    saveToken(response.token);
    return response;
};

export const logout = async (): Promise<void> => {
    const token = getToken();

    if (token) {
        try {
            await apiFetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });
        } catch (error) {
            // Even if the request fails (e.g. offline), still clear the
            // local token so the user is signed out on this device.
            console.error('Error invalidating token on server:', error);
        }
    }

    removeToken();
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, 'Failed to send password reset email'));
    }
};

export const resetPassword = async (data: ResetPasswordData): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(extractErrorMessage(errorData, 'Failed to reset password'));
    }
};

export const isAuthenticated = (): boolean => {
    return getUserFromToken() !== null;
};
