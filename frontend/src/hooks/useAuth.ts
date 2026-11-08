
import { useEffect, useState } from "react";

type AuthUser = {
    email: string;
    role: string;
};

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthentication = async () => {
            // Get JWT token from session storage
            const token = sessionStorage.getItem("jwt");

            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            try {
                // Verify JWT with backend
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        sessionStorage.removeItem("jwt");
                    }

                    setUser(null);
                    return;
                }

                const data = (await response.json()) as AuthUser;

                setUser(data);

            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        void checkAuthentication();
    }, []);

    return {
        user,
        isAuthenticated: user !== null,
        isLoading,
    };
};
