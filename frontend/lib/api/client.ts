import { saveToken } from './tokenStorage';

const REFRESHED_TOKEN_HEADER = 'X-Refreshed-Token';

// Thin wrapper around fetch() for authenticated API calls. If the backend
// issued a fresh token because the caller's token is close to expiring
// (sliding expiration), transparently store it so the next request uses it.
export const apiFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> => {
    const res = await fetch(input, init);

    const refreshedToken = res.headers.get(REFRESHED_TOKEN_HEADER);
    if (refreshedToken) {
        saveToken(refreshedToken);
    }

    return res;
};
