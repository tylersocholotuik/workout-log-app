import {User, RegisterData, LoginData, ResetPasswordData, AuthResponse} from '@/types';
import {extractErrorMessage} from './apiErrors';
import {apiFetch} from './client';

// NEXT_PUBLIC_API_URL should be left unset in Vercel (staging/production) so
// requests are made relative to the frontend's own origin and proxied to the
// backend via the rewrite in next.config.ts (see BuildAuthCookieOptions in
// JwtService.cs for why). It's only needed locally, where the frontend calls
// the backend directly - Vercel doesn't support saving an empty-string env
// var (it just discards it), so the "same-origin" default only applies when
// NODE_ENV is "production" (true for both Vercel environments), not merely
// when the variable is unset.
const API_URL = process.env.NEXT_PUBLIC_API_URL
    ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5258');

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
    
    return await res.json();
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
    
    return await res.json();
};

export const logout = async (): Promise<void> => {
    await apiFetch(`${API_URL}/api/auth/logout`, {method: 'POST'});
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({email}),
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

export const fetchCurrentUser = async (): Promise<User | null> => {
    const res = await apiFetch(`${API_URL}/api/auth/me`, {method: 'GET'});

    if (res.ok) {
        return await res.json();
    } else if (res.status === 401) {
        return null;
    } else {
        throw new Error('Failed to fetch current user');
    }
};

