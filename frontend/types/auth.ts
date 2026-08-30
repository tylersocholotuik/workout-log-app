export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    isAdmin: boolean;
}

export interface RegisterData {
    email: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
