const CSRF_HEADER_NAME = 'X-Requested-With';

// Thin wrapper around fetch() for authenticated API calls. If the backend
// issued a fresh token because the caller's token is close to expiring
// (sliding expiration), transparently store it so the next request uses it.
export const apiFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> => {
    // Prevent CSRF attacks by adding a custom header to all requests. The backend will check for this header and reject requests that don't have it.
    const headers = new Headers(init?.headers);
    headers.set(CSRF_HEADER_NAME, 'XMLHttpRequest');
    // Include credentials (cookies) in the request to support authenticated API calls.
    const res = await fetch(input, { ...init, credentials: 'include', headers });
    
    const url = typeof input === 'string' ? input : input.toString();
    
    const noRedirectEndpoints = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/me",
    ];
    
    const skipRedirect = noRedirectEndpoints.some(endpoint => url.includes(endpoint));
    
    // Redirect to login page if the user is not authenticated and the endpoint isn't one of the above
    if (res.status === 401 && !skipRedirect) {
        window.location.href = '/login';
    }

    return res;
};
