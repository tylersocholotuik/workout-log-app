// Reusable, pure field validators for user-profile/account forms (login,
// signup, profile editing, password change). Rules are kept in sync with the
// backend's DataAnnotations (see RegisterRequest.cs, PatchUserDto.cs,
// ChangePasswordRequest.cs) so client-side errors match server-side ones.
// Each validator returns the error message, or undefined when the value is valid.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) {
        return "Email is required.";
    }
    if (email.length > 255) {
        return "Email must be less than 255 characters.";
    }
    if (!EMAIL_REGEX.test(email)) {
        return "Invalid email address.";
    }
};

export const validateFirstName = (firstName: string): string | undefined => {
    if (!firstName.trim()) {
        return "First name is required.";
    }
    if (firstName.length > 50) {
        return "First name must be less than 50 characters.";
    }
};

export const validateLastName = (lastName: string): string | undefined => {
    if (!lastName.trim()) {
        return "Last name is required.";
    }
    if (lastName.length > 50) {
        return "Last name must be less than 50 characters.";
    }
};

// Display name is always optional, so an empty string is valid.
export const validateDisplayName = (displayName: string): string | undefined => {
    if (displayName.length > 25) {
        return "Display name must be less than 25 characters.";
    }
};

export const validatePassword = (password: string, label = "Password"): string | undefined => {
    if (!password) {
        return `${label} is required.`;
    }
    if (password.length < 6) {
        return `${label} must be at least 6 characters.`;
    }
    if (password.length > 100) {
        return `${label} must be 100 characters or less.`;
    }
};

export const validatePasswordsMatch = (password: string, confirmPassword: string): string | undefined => {
    if (password !== confirmPassword) {
        return "Passwords do not match.";
    }
};

// Runs one validator per field against `values` and returns only the fields
// that failed. Lets each form keep its own formData/errors shape while
// sharing the actual validation rules above
export const runValidators = <T extends Record<string, unknown>>(
    values: T,
    validators: { [K in keyof T]?: (value: T[K]) => string | undefined }
): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {};

    (Object.keys(validators) as (keyof T)[]).forEach((field) => {
        const validator = validators[field];
        const message = validator?.(values[field]);

        if (message) {
            errors[field] = message;
        }
    });

    return errors;
};
