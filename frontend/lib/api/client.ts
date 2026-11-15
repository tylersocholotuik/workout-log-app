import Router from 'next/router';
import { NO_REDIRECT_ENDPOINTS } from '@/lib/constants/routes';

const CSRF_HEADER_NAME = 'X-Requested-With';

// NEXT_PUBLIC_API_URL should be left unset in Vercel (staging/production) so
// requests are made relative to the frontend's own origin and proxied to the
// backend via the rewrite in next.config.ts (see BuildAuthCookieOptions in
// JwtService.cs for why). It's only needed locally, where the frontend calls
// the backend directly - Vercel doesn't support saving an empty-string env
// var (it just discards it), so the "same-origin" default only applies when
// NODE_ENV is "production" (true for both Vercel environments), not merely
// when the variable is unset.
export const API_URL = process.env.NEXT_PUBLIC_API_URL
    ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5258');

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
    
    const skipRedirect = NO_REDIRECT_ENDPOINTS.some(endpoint => url.includes(endpoint));
    
    // Redirect to login page if the user is not authenticated and the endpoint isn't one of the above
    if (res.status === 401 && !skipRedirect) {
        await Router.push('/login');
    }

    return res;
};
