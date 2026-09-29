import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import LePantsLogo from "../assets/LePantsLogo.svg";

type LoginResponse = {
    message?: string;
    email?: string;
    role?: string;
};

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<LoginResponse | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });
            const responseData = (await response.json().catch(() => ({}))) as LoginResponse;

            if (!response.ok) {
                throw new Error(responseData.message ?? "Unable to sign in. Please try again.");
            }

            setUser(responseData);
        } catch (loginError) {
            setError(
                loginError instanceof Error
                    ? loginError.message
                    : "Unable to connect. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="antialiased min-h-screen flex items-center justify-center bg-dark-bg px-4 py-10 text-white font-sans selection:bg-wine selection:text-white">
            <div className="w-full max-w-md">
                <header className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 mb-4 overflow-hidden rounded-full border border-card-border bg-card-bg p-1 shadow-xl">
                        <img
                            alt="Le Pants logo"
                            className="h-full w-full rounded-full object-cover"
                            src={LePantsLogo}
                        />
                    </div>
                    <p className="font-headline text-3xl font-bold text-white">Le Pants</p>
                    <div className="mt-3 h-0.5 w-12 rounded-full bg-wine" />
                </header>

                <section className="rounded-2xl border border-card-border bg-card-bg p-6 shadow-2xl sm:p-8">
                    {user ? (
                        <div className="space-y-6 text-center" role="status" aria-live="polite">
                            <div>
                                <p className="font-headline text-2xl font-semibold">Welcome back</p>
                                <p className="mt-2 text-sm text-zinc-400">You are signed in as</p>
                                <p className="mt-1 font-medium text-white">{user.email ?? email}</p>
                                {user.role && (
                                    <p className="mt-2 text-sm text-zinc-400">{user.role}</p>
                                )}
                            </div>
                            <Link
                                to="/reserve"
                                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-wine px-6 font-bold text-white transition-colors hover:bg-wine-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-light"
                            >
                                Continue to reservations
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-7 text-center">
                                <h1 className="font-headline text-2xl font-semibold text-white">Welcome back</h1>
                                <p className="mt-2 text-sm text-zinc-400">Sign in to your account</p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-200">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="username"
                                        required
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        className="min-h-12 w-full rounded-lg border border-card-border bg-surface-input px-4 text-white outline-none transition focus:border-wine-light focus:ring-2 focus:ring-wine/30"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-200">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className="min-h-12 w-full rounded-lg border border-card-border bg-surface-input px-4 text-white outline-none transition focus:border-wine-light focus:ring-2 focus:ring-wine/30"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-red-400" role="alert">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="min-h-12 w-full rounded-xl bg-wine px-6 font-bold text-white transition-colors hover:bg-wine-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-light"
                                >
                                    {isSubmitting ? "Signing in..." : "Sign in"}
                                </button>
                            </form>
                        </>
                    )}
                </section>

                <p className="mt-6 text-center text-sm text-zinc-400">
                    <Link className="transition-colors hover:text-white" to="/reserve">
                        Back to reservations
                    </Link>
                </p>
            </div>
        </main>
    );
};