import { storeJwt } from "./api";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export type Account = {
    id: number;
    username: string;
    email: string;
    roleId: number;
};

/** A failed request, with the server's message and HTTP status. */
export class ApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

/** Signed-in user's account, or null when nobody is signed in (or the request fails). */
export async function fetchCurrentAccount(): Promise<Account | null> {
    try {
        const response = await fetch(`${API_URL}/users/me`, { credentials: "include" });
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    }
}

/** Send a JSON body with the CSRF header. Throws an ApiError with the server's message on failure. */
async function sendJson<T>(method: "POST" | "PUT", path: string, body: unknown, fallbackError: string): Promise<T> {
    const csrfResponse = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
    if (!csrfResponse.ok) throw new ApiError(fallbackError, csrfResponse.status);
    const csrf = await csrfResponse.json();

    const response = await fetch(`${API_URL}${path}`, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(data.message || fallbackError, response.status);
    return data as T;
}

export async function updateAccount(
    id: number,
    changes: { username: string; email: string }
): Promise<Account> {
    // The backend sends a new token when the email changes, because the old one is tied to the old email.
    const { token, ...account } = await sendJson<Account & { token?: string }>(
        "PUT",
        `/users/${id}`,
        changes,
        "Could not update account information."
    );
    if (token) storeJwt(token);
    return account;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await sendJson("PUT", "/users/me/password", { currentPassword, newPassword }, "Could not update password.");
}

export async function createUser(user: Omit<Account, "id"> & { password: string }): Promise<void> {
    await sendJson("POST", "/users", user, "Could not create user.");
}
