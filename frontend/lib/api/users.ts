import {User, UserSettings, PatchUser} from '@/types';
import {throwApiError} from './apiErrors';
import {apiFetch, API_URL} from './client';

export const fetchCurrentUser = async (): Promise<User | null> => {
    const res = await apiFetch(`${API_URL}/api/users/me`, {method: 'GET'});

    if (res.ok) {
        return await res.json();
    } else if (res.status === 401) {
        return null;
    } else {
        return await throwApiError(res, 'Failed to fetch current user');
    }
};

export const getUserSettings = async (): Promise<UserSettings | null> => {
    const res = await apiFetch(`${API_URL}/api/users/me/settings`, {method: 'GET'});
    
    if (!res.ok) {
        await throwApiError(res, 'Failed to fetch user settings');
    }
    
    return await res.json();
};

export const updateUserInfo = async (userInfo: PatchUser): Promise<User> => {
    const res = await apiFetch(`${API_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
    });

    if (!res.ok) {
        await throwApiError(res, 'Failed to update user info');
    }

    return await res.json();
};

export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const res = await apiFetch(`${API_URL}/api/users/me/settings`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    });

    if (!res.ok) {
        await throwApiError(res, 'Failed to update user settings');
    }
    
    return await res.json();
};