const TOKEN_KEY = 'workout_auth_token';
// Fallback only, used if a token's exp claim can't be read (malformed token).
// Kept short so a bad token can't linger in storage for a full hour.
const FALLBACK_MAX_AGE_SECONDS = 5 * 60;

// Reads the token's own "exp" claim so the cookie's lifetime always matches the
// backend's Jwt:TokenExpirationInMinutes setting, without duplicating that value
// here. This keeps the two in sync automatically if the backend config changes.
const getMaxAgeFromToken = (token: string): number => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (typeof payload.exp !== 'number') return FALLBACK_MAX_AGE_SECONDS;

        const secondsUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
        return secondsUntilExpiry > 0 ? secondsUntilExpiry : 0;
    } catch {
        return FALLBACK_MAX_AGE_SECONDS;
    }
};

// Low-level cookie-backed token storage. Split out from auth.ts so it can be
// imported by client.ts (the apiFetch wrapper) without creating a circular
// dependency between auth.ts <-> client.ts.
export const saveToken = (token: string): void => {
    if (typeof document === 'undefined') return;

    const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    const maxAge = getMaxAgeFromToken(token);

    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secureFlag}`;
};

export const getToken = (): string | null => {
    if (typeof document === 'undefined') return null;

    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${TOKEN_KEY}=`));

    return match ? decodeURIComponent(match.substring(TOKEN_KEY.length + 1)) : null;
};

export const removeToken = (): void => {
    if (typeof document === 'undefined') return;

    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
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
