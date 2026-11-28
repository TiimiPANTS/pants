// Field rules shared by the staff account forms. The limits match the backend's
// UserRequestDTO, UserUpdateDTO and PasswordChangeRequestDTO.

export const USERNAME_MAX = 50;
export const EMAIL_MAX = 254;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Error for a trimmed username, or undefined when it is fine. */
export function usernameError(username: string): string | undefined {
    if (!username) return "Enter a username.";
    if (username.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters.`;
}

/** Error for a trimmed email address, or undefined when it is fine. */
export function emailError(email: string): string | undefined {
    if (!email) return "Enter an email address.";
    if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX) return "Enter a valid email address, like name@example.com.";
}

/** Length error for a non-empty password, or undefined when it is fine. Each form words its own "missing" message. */
export function passwordLengthError(password: string): string | undefined {
    if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
    if (password.length > PASSWORD_MAX) return `Use at most ${PASSWORD_MAX} characters.`;
}

/** True when any field in a form's error map has an error. */
export const hasErrors = (errors: Record<string, string | undefined>) => Object.values(errors).some(Boolean);
