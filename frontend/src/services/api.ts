const BACKEND_URL = String(
    import.meta.env.VITE_BACKEND_URL ?? ""
).replace(/\/+$/, "");

const API_BASE_URL = new URL(
    `${BACKEND_URL}/api/`,
    window.location.href
);

// Keep true while backend CSRF protection is enabled
const USE_LEGACY_CSRF = false;

// Check which API requests are public
function isPublicRequest(path: string, method: string): boolean {

    // Authentication endpoints
    if (
        path === "/auth/login" ||
        path === "/auth/logout" ||
        path === "/auth/csrf"
    ) {
        return true;
    }

    // Public reservation creation
    if (method === "POST" && path === "/reservations") {
        return true;
    }

    // Public reservation availability
    if (
        method === "GET" &&
        path === "/reservations/availability"
    ) {
        return true;
    }

    // Customer reservation management using edit token
    if (path.startsWith("/reservations/manage/")) {
        return true;
    }

    // Public receipt creation
    if (
        method === "POST" &&
        /^\/receipts\/[^/]+$/.test(path)
    ) {
        return true;
    }

    return false;
}

let installed = false;

export function installApiInterceptor(): void {

    if (installed) return;
    installed = true;

    // Save original fetch function
    const originalFetch = window.fetch.bind(window);

    // Intercept all fetch requests
    window.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit
    ): Promise<Response> => {

        const requestUrl = new URL(
            input instanceof Request ? input.url : String(input),
            window.location.href
        );

        // Do not intercept requests to other services
        if (
            requestUrl.origin !== API_BASE_URL.origin ||
            !requestUrl.pathname.startsWith(API_BASE_URL.pathname)
        ) {
            return originalFetch(input, init);
        }

        const path =
            "/" + requestUrl.pathname.slice(API_BASE_URL.pathname.length);

        const method = (
            init?.method ??
            (input instanceof Request ? input.method : "GET")
        ).toUpperCase();

        // Login: automatically save JWT
        if (path === "/auth/login" && method === "POST") {

            const response = await originalFetch(input, init);

            if (response.ok) {
                const data = await response.clone()
                    .json()
                    .catch(() => null);

                if (typeof data?.token === "string") {
                    sessionStorage.setItem("jwt", data.token);
                }
            }

            return response;
        }

        // Logout: automatically remove JWT
        if (path === "/auth/logout" && method === "POST") {

            const response = await originalFetch(input, init);

            if (response.ok) {
                sessionStorage.removeItem("jwt");
            }

            return response;
        }

        // Temporary compatibility with old CSRF requests
        if (path === "/auth/csrf" && method === "GET") {

            // Current backend: fetch real CSRF token
            if (USE_LEGACY_CSRF) {
                return originalFetch(input, init);
            }

            // Future stateless backend: CSRF is not required
            // Return compatible data for old frontend code
            return new Response(
                JSON.stringify({
                    headerName: "X-CSRF-TOKEN",
                    token: "not-required",
                }),
                {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        // Public endpoints do not need JWT
        if (isPublicRequest(path, method)) {
            return originalFetch(input, init);
        }

        // Get stored JWT
        const token = sessionStorage.getItem("jwt");

        if (!token) {
            return originalFetch(input, init);
        }

        // Preserve existing request configuration
        const request = new Request(input, init);
        const headers = new Headers(request.headers);

        // Add JWT automatically
        if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        const response = await originalFetch(
            new Request(request, { headers })
        );

        // Remove an invalid or expired JWT
        if (response.status === 401) {
            sessionStorage.removeItem("jwt");
        }

        return response;
    };
}
