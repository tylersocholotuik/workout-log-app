const TOKEN_KEY = 'workout_auth_token';
const TOKEN_MAX_AGE_MINUTES = parseFloat(process.env.NEXT_PUBLIC_TOKEN_MAX_AGE_MINUTES || '60');

// Low-level cookie-backed token storage. Split out from auth.ts so it can be
// imported by client.ts (the apiFetch wrapper) without creating a circular
// dependency between auth.ts <-> client.ts.
export const saveToken = (token: string): void => {
    if (typeof document === 'undefined') return;

    const secureFlag = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    const maxAge = TOKEN_MAX_AGE_MINUTES * 60;

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
