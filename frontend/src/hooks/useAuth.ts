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
        const checkSession = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    credentials: "include",
                });

                if (!response.ok) {
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

        void checkSession();
    }, []);

    return {
        user,
        isAuthenticated: user !== null,
        isLoading,
    };
};