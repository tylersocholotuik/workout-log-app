import { User, RegisterData, LoginData, AuthResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5258';

const TOKEN_KEY = 'workout_auth_token';

// Auth Helpers
export const saveToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
};

export const getAuthHeaders = (): HeadersInit => {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
};

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
            firstName: payload.firstName,
            lastName: payload.lastName,
            displayName: payload.displayName || null,
            isAdmin: payload.isAdmin === 'True' || payload.isAdmin === true
        };
    } catch (error) {
        console.error('Error parsing token:', error);
        removeToken();
        return null;
    }
};

// Auth API calls
export const register = async (data: RegisterData): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to register');
    }

    const response: AuthResponse = await res.json();
    saveToken(response.token);
    return response;
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to login');
    }

    const response: AuthResponse = await res.json();
    saveToken(response.token);
    return response;
};

export const logout = (): void => {
    removeToken();
};

export const isAuthenticated = (): boolean => {
    return getUserFromToken() !== null;
};
