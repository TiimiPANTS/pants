import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import interiorImage from "../assets/interior.png";
import LePantsLogo from "../assets/LePantsLogo.svg";

type LoginResponse = {
    message?: string;
    email?: string;
    role?: string;
};
type ValidationErrors = {
    email?: string;
    password?: string;
}

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const LoginPage = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] =
        useState<ValidationErrors>({});
    const [user, setUser] = useState<LoginResponse | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const errors: ValidationErrors = {};

        if (!email.trim()) {
            errors.email = "Email is required.";
        } else {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email.trim())) {
                errors.email = "Enter an email like name@example.com";
            }
        }

        if (!password.trim()) {
            errors.password = "Password is required.";
        }

        setValidationErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }
    
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

            // All staff roles work from the bookings dashboard.
            if (["ADMIN", "OWNER", "EMPLOYEE"].includes(responseData.role ?? "")) {
                navigate("/dashboard");
            }

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
        <main className="relative isolate antialiased min-h-screen flex items-center justify-center overflow-hidden bg-dark-bg px-4 py-10 text-white font-sans selection:bg-wine selection:text-white">
            {/* Dining room, softly blurred and darkened behind the card */}
            <img
                src={interiorImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 -z-20 h-full w-full scale-110 object-cover blur-md"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-dark-bg/80 via-dark-bg/70 to-dark-bg" aria-hidden="true" />

            <div className="w-full max-w-md">
                <header className="flex flex-col items-center text-center mb-8">
                    <Link
                        to="/"
                        className="flex flex-col items-center rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine-light"
                    >
                        <span className="mb-4 h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-card-bg p-1 shadow-xl">
                            <img
                                alt="Le Pants logo"
                                className="h-full w-full rounded-full object-cover"
                                src={LePantsLogo}
                            />
                        </span>
                        <span className="font-headline text-4xl font-normal italic text-white">Le Pants</span>
                    </Link>
                    <span className="mt-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-400">
                        Staff
                    </span>
                </header>

                <section className="rounded-3xl border border-white/10 bg-card-bg/70 p-6 shadow-2xl backdrop-blur-xl sm:p-9">
                    {user ? (
                        <div className="space-y-6 text-center" role="status" aria-live="polite">
                            <div>
                                <p className="font-headline text-3xl font-normal italic">Welcome back</p>
                                <p className="mt-2 text-sm text-zinc-400">You are signed in as</p>
                                <p className="mt-1 font-medium text-white">{user.email ?? email}</p>
                                {user.role && (
                                    <p className="mt-2 text-sm text-zinc-400">{user.role}</p>
                                )}
                            </div>
                            <Link
                                to="/reserve"
                                className="flex min-h-12 w-full items-center justify-center rounded-full border border-[#B52252] bg-wine px-6 font-semibold text-white transition-colors hover:bg-wine-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-light"
                            >
                                Continue to reservations
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-7 text-center">
                                <h1 className="font-headline text-3xl font-normal italic text-white">Welcome back</h1>
                                <p className="mt-2 text-sm text-zinc-400">Sign in to manage bookings</p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="text"
                                        autoComplete="username"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-[#ffb2bf]/60 focus:ring-2 focus:ring-wine/30"
                                    />
                                    {validationErrors.email && (
                                       <p className="mt-1 text-sm text-red-400">
                                            {validationErrors.email}
                                       </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="password" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-[#ffb2bf]/60 focus:ring-2 focus:ring-wine/30"
                                    />

                                    {validationErrors.password && (
                                        <p className="mt-1 text-sm text-red-400">
                                            {validationErrors.password}
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-sm text-red-400" role="alert">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="!mt-7 min-h-12 w-full rounded-full border border-[#B52252] bg-wine px-6 font-semibold text-white transition-colors hover:bg-[#B52252] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-light"
                                >
                                    {isSubmitting ? "Signing in..." : "Sign in"}
                                </button>
                            </form>
                        </>
                    )}
                </section>

                <p className="mt-6 text-center text-sm text-zinc-400">
                    <Link className="inline-flex min-h-11 items-center px-2 transition-colors hover:text-white" to="/">
                        Back to home page
                    </Link>
                </p>
            </div>
        </main>
    );
};