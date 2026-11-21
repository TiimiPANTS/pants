import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

type User = {
    id: number;
    username: string;
    email: string;
    roleId: number;
};

export default function UserManagement() {
    const navigate = useNavigate();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const getRoleName = (roleId: number | string): string => {
        switch (Number(roleId)) {
            case 1:
                return "Admin";
            case 2:
                return "Owner";
            case 3:
                return "Employee";
            default:
                return "Unknown";
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const authResponse = await fetch(`${API_URL}/users/me`, {
                    credentials: "include",
                });

                if (authResponse.status === 401 || authResponse.status === 403) {
                    navigate("/login");
                    return;
                }

                if (!authResponse.ok) {
                    throw new Error("Could not verify user.");
                }

                const userData = await authResponse.json();

                const roleId = Number(userData.roleId);

                if (roleId !== 1 && roleId !== 2) {
                    navigate("/login");
                    return;
                }

                const response = await fetch(`${API_URL}/users`, {
                    credentials: "include",
                });

                if (response.status === 401 || response.status === 403) {
                    navigate("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Could not fetch users.");
                }

                const data: User[] = await response.json();

                const filteredUsers = roleId === 2
                    ? data.filter(user => Number(user.roleId) !== 1)
                    : data;

                setUsers(filteredUsers);

            } catch (error) {
                console.error("Failed to fetch users:", error);
                setMessage("Could not load users.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
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

    return (
        <main className="min-h-screen bg-dark-bg px-4 py-8 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">

                {/* Page header */}
                <header className="mb-8 flex items-center justify-between border-b border-card-border pb-6">
                    <div>
                        <h1 className="font-headline text-3xl font-semibold">
                            User Management
                        </h1>
                        <p className="mt-1 text-sm text-zinc-400">
                            View and manage all registered users
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
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

                {/* Users section */}
                <section className="rounded-xl border border-card-border bg-card-bg p-6">

                    {/* Section heading */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="font-headline text-xl font-semibold">
                                All Users
                            </h2>
                            <p className="mt-1 text-sm text-zinc-400">
                                {users.length} registered users
                            </p>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <p className="py-8 text-center text-sm text-zinc-400">
                            Loading users...
                        </p>
                    )}

                    {/* Error state */}
                    {!loading && message && (
                        <p className="py-8 text-center text-sm text-red-400">
                            {message}
                        </p>
                    )}

                    {/* Users table */}
                    {!loading && !message && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">

                                <thead className="border-b border-card-border text-zinc-400">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Username
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Role
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="border-b border-card-border last:border-0 transition hover:bg-dark-bg/50"
                                        >
                                            <td className="px-4 py-4 font-medium">
                                                {user.username}
                                            </td>

                                            <td className="px-4 py-4 text-zinc-400">
                                                {user.email}
                                            </td>

                                            <td className="px-4 py-4">
                                                <span className="text-zinc-300">
                                                    {getRoleName(user.roleId)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {users.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-4 py-10 text-center text-zinc-400"
                                            >
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* Add New User button */}
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => navigate("/owner/adduser")}
                            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
                        >
                            Add New User
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
};