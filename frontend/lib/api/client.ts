import { saveToken, removeToken } from './tokenStorage';

const REFRESHED_TOKEN_HEADER = 'X-Refreshed-Token';

// Thin wrapper around fetch() for authenticated API calls. If the backend
// issued a fresh token because the caller's token is close to expiring
// (sliding expiration), transparently store it so the next request uses it.
export const apiFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> => {
    const res = await fetch(input, init);
    
    const hasAuthHeader = init?.headers && new Headers(init.headers).get('Authorization');
    
    // If the user is not authenticated, redirect to the login page and expire the token in the cookie.
    if (res.status === 401 && hasAuthHeader) {
        removeToken();
        window.location.href = '/login';
    }

    const refreshedToken = res.headers.get(REFRESHED_TOKEN_HEADER);
    if (refreshedToken) {
        saveToken(refreshedToken);
    }

    return res;
};
