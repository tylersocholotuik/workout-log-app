import { User } from './user';

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

export interface ResetPasswordData {
    token: string;
    newPassword: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export interface AuthResponse {
    user: User;
}
