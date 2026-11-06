import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function AddUser() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [roleId, setRoleId] = useState("");

    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const response = await fetch(`${API_URL}/users/me`, {
                    credentials: "include",
                });

                if (response.status === 401 || response.status === 403) {
                    navigate("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Could not verify user.");
                }

            } catch (error) {
                console.error("Authentication check failed:", error);
                navigate("/login");
            }
        };

        checkUser();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            navigate("/login");
        }
    };

    const handleCreateUser = async () => {
        setMessage("");
        setIsError(false);

        if (!username || !email || !password || !roleId) {
            setIsError(true);
            setMessage("Please fill in all fields.");
            return;
        }

        try {
            const csrfResponse = await fetch(`${API_URL}/auth/csrf`, {
                credentials: "include",
            });

            if (!csrfResponse.ok) {
                throw new Error("Could not get CSRF token.");
            }

            const csrfData = await csrfResponse.json();

            const response = await fetch(`${API_URL}/users`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    [csrfData.headerName]: csrfData.token,
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    roleId: Number(roleId),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Could not create user.");
            }

            setUsername("");
            setEmail("");
            setPassword("");
            setRoleId("");

            setIsError(false);
            setMessage("User created successfully!");

        } catch (error) {
            console.error("Failed to create user:", error);
            setIsError(true);
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Could not create user."
            );
        }
    };

    return (
        <main className="min-h-screen bg-dark-bg px-4 py-8 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">

                {/* Page header */}
                <header className="mb-8 flex items-center justify-between border-b border-card-border pb-6">
                    <div>
                        <h1 className="font-headline text-3xl font-semibold">
                            New user
                        </h1>
                        <p className="mt-1 text-sm text-zinc-400">
                            Create a new user account
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        <button
                            type="button"
                            onClick={() => navigate("/owner/dashboard")}
                            className="rounded border border-card-border px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-card-bg hover:text-white"
                        >
                            Dashboard
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded border border-card-border px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-card-bg hover:text-white"
                        >
                            Log out
                        </button>
                    </div>
                </header>

                {/* Add user form */}
                <section className="max-w-2xl rounded-xl border border-card-border bg-card-bg p-6">
                    <h2 className="mb-6 font-headline text-xl font-semibold">
                        User information
                    </h2>

                    <form className="space-y-5">
                        {/* Username */}
                        <div>
                            <label
                                htmlFor="username"
                                className="mb-2 block text-sm text-zinc-300"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm text-zinc-300"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm text-zinc-300"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                            />
                        </div>

                        {/* Role */}
                        <div>
                            <label
                                htmlFor="role"
                                className="mb-2 block text-sm text-zinc-300"
                            >
                                Role
                            </label>
                            <select
                                id="role"
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white focus:border-white focus:outline-none"
                            >
                                <option value="">Select a role</option>
                                <option value="1">Admin</option>
                                <option value="2">Owner</option>
                            </select>
                        </div>

                        {/* Create button and message */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleCreateUser}
                                className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
                            >
                                Create user
                            </button>

                            {message && (
                                <p className={`mt-3 text-sm ${isError ? "text-red-400" : "text-white"}`}>
                                    {message}
                                </p>
                            )}
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}