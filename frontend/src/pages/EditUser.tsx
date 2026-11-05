import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function EditUser() {
    const navigate = useNavigate();

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

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    credentials: "include",
                });

                if (response.status === 401 || response.status === 403) {
                    navigate("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to verify authentication.");
                }

            } catch (error) {
                console.error("Authentication check failed:", error);
                navigate("/login");
            }
        };

        checkAuthentication();
    }, [navigate]);

    return (
        <main className="min-h-screen bg-dark-bg px-4 py-8 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">

                {/* Page header */}
                <header className="mb-8 flex items-center justify-between border-b border-card-border pb-6">
                    <div>
                        <h1 className="font-headline text-3xl font-semibold">
                            My Account
                        </h1>
                        <p className="mt-1 text-sm text-zinc-400">
                            Manage your personal information and account settings
                        </p>
                    </div>

                    {/* Header buttons */}
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

                {/* Account settings */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                    {/* Personal information */}
                    <section className="rounded-xl border border-card-border bg-card-bg p-6">
                        <h2 className="mb-6 font-headline text-xl font-semibold">
                            Personal information
                        </h2>

                        <form className="space-y-5">
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm text-zinc-300"
                                >
                                    Username
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Enter username"
                                    className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                                />
                            </div>

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
                                    placeholder="Enter email address"
                                    className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
                                >
                                    Save changes
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Change password */}
                    <section className="rounded-xl border border-card-border bg-card-bg p-6">
                        <h2 className="mb-6 font-headline text-xl font-semibold">
                            Change password
                        </h2>

                        <form className="space-y-5">
                            <div>
                                <label
                                    htmlFor="currentPassword"
                                    className="mb-2 block text-sm text-zinc-300"
                                >
                                    Current password
                                </label>
                                <input
                                    id="currentPassword"
                                    type="password"
                                    placeholder="Enter current password"
                                    className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="newPassword"
                                    className="mb-2 block text-sm text-zinc-300"
                                >
                                    New password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Enter new password"
                                    className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="confirmPassword"
                                    className="mb-2 block text-sm text-zinc-300"
                                >
                                    Confirm new password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm new password"
                                    className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
                                >
                                    Update password
                                </button>
                            </div>
                        </form>
                    </section>

                </div>
            </div>
        </main>
    );
}