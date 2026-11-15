export const PROTECTED_PAGES = [
    "/workout/[workoutId]",
    "/history",
    "/account"
];

// Endpoints that should not trigger a redirect to /login on a 401 response,
// since a 401 from these is an expected outcome (e.g. a failed login
// attempt, or the initial auth check on page load) rather than an expired
// session.
export const NO_REDIRECT_ENDPOINTS = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/users/me",
];
