import {RegisterData, LoginData, ResetPasswordData, ChangePasswordData, AuthResponse} from '@/types';
import {throwApiError} from './apiErrors';
import {apiFetch, API_URL} from './client';

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
        await throwApiError(res, 'Failed to register');
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
        await throwApiError(res, 'Failed to login');
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
        await throwApiError(res, 'Failed to send password reset email');
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
        await throwApiError(res, 'Failed to reset password');
    }
};


export const changePassword = async (data: ChangePasswordData): Promise<void> => {
    const res = await apiFetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        await throwApiError(res, 'Failed to change password');
    }
};
