/**
 * Temporary compatibility helper.
 *
 * CSRF protection is disabled because authentication
 * now uses JWT Bearer tokens.
 *
 * This function can be removed after its callers
 * have been cleaned up.
 */
export const getCsrfHeaders = async (): Promise<Record<string, string>> => {
    const response = await fetch(`${API_URL}/auth/csrf`, {
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Unable to get CSRF token.");
    }

    const { headerName, token } = (await response.json()) as CsrfResponse;

    return { [headerName]: token };
};
