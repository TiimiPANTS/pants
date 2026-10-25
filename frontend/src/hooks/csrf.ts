const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

type CsrfResponse = {
    headerName: string;
    token: string;
};

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