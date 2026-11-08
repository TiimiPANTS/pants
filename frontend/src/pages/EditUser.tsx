
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordForm from "../components/ChangePasswordForm";
import PersonalForm from "../components/PersonalForm";
import { getCsrfHeaders } from "../hooks/csrf";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

type UserResponse = {
    id: number;
    username: string;
    email: string;
};

type ErrorResponse = {
    message?: string;
};

export default function EditUser() {
    const navigate = useNavigate();

    const [userId, setUserId] = useState<number | null>(null);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [originalEmail, setOriginalEmail] = useState("");
    const [saveMessage, setSaveMessage] = useState("");
    const [saveError, setSaveError] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState(false);

    // Logout and remove JWT
    const handleLogout = async () => {
        try {
            // End old session during migration
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            sessionStorage.removeItem("jwt");
            navigate("/login", { replace: true });
        }
    };

    // Load account information using JWT
    useEffect(() => {
        const loadUser = async () => {
            const token = sessionStorage.getItem("jwt");

            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await fetch(`${API_URL}/users/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    sessionStorage.removeItem("jwt");
                    navigate("/login");
                    return;
                }

                if (response.status === 403) {
                    navigate("/owner/dashboard");
                    return;
                }

                if (!response.ok) {
                    throw new Error(
                        "Unable to load account information."
                    );
                }

                const user = (await response.json()) as UserResponse;

                setUserId(user.id);
                setUsername(user.username);
                setEmail(user.email);
                setOriginalEmail(user.email);

            } catch (error) {
                console.error(
                    "Failed to load account information:",
                    error
                );
                navigate("/login");
            }
        };

        void loadUser();
    }, [navigate]);

    // Update account details using JWT
    const handleSaveChanges = async () => {
        setSaveMessage("");
        setSaveError(false);

        if (userId === null) {
            return;
        }

        const token = sessionStorage.getItem("jwt");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            // CSRF remains enabled during migration
            const csrfHeaders = await getCsrfHeaders();

            const response = await fetch(`${API_URL}/users/${userId}`, {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    ...csrfHeaders,
                },
                body: JSON.stringify({
                    username,
                    email,
                }),
            });

            if (response.status === 401) {
                sessionStorage.removeItem("jwt");
                navigate("/login");
                return;
            }

            if (!response.ok) {
                const errorData = (await response.json().catch(
                    () => ({})
                )) as ErrorResponse;

                throw new Error(
                    errorData.message ||
                    "Could not update account information."
                );
            }

            const updatedUser =
                (await response.json()) as UserResponse;

            setUsername(updatedUser.username);
            setEmail(updatedUser.email);

            // JWT subject contains the old email.
            // Login again when the email changes.
            if (updatedUser.email !== originalEmail) {
                await handleLogout();
                return;
            }

            setOriginalEmail(updatedUser.email);
            setSaveError(false);
            setSaveMessage(
                "Account information updated successfully"
            );

        } catch (error) {
            console.error("Failed to update account:", error);

            setSaveError(true);
            setSaveMessage(
                error instanceof Error
                    ? error.message
                    : "Could not update account information."
            );
        }
    };

    // Change password using JWT
    const handleChangePassword = async () => {
        setPasswordMessage("");
        setPasswordError(false);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError(true);
            setPasswordMessage(
                "Please fill in all password fields."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(true);
            setPasswordMessage("New passwords do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError(true);
            setPasswordMessage(
                "New password must be different from current password."
            );
            return;
        }

        const token = sessionStorage.getItem("jwt");

        if (!token) {
            navigate("/login");
            return;
        }

        try {
            // CSRF remains enabled during migration
            const csrfHeaders = await getCsrfHeaders();

            const response = await fetch(
                `${API_URL}/users/me/password`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                        ...csrfHeaders,
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                    }),
                }
            );

            if (response.status === 401) {
                sessionStorage.removeItem("jwt");
                navigate("/login");
                return;
            }

            if (!response.ok) {
                const errorData = (await response.json().catch(
                    () => ({})
                )) as ErrorResponse;

                throw new Error(
                    errorData.message ||
                    "Could not update password."
                );
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setPasswordError(false);
            setPasswordMessage(
                "Password updated successfully!"
            );

        } catch (error) {
            console.error("Failed to update password:", error);

            setPasswordError(true);
            setPasswordMessage(
                error instanceof Error
                    ? error.message
                    : "Could not update password."
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

                    <PersonalForm
                        username={username}
                        email={email}
                        onUsernameChange={setUsername}
                        onEmailChange={setEmail}
                        onSave={handleSaveChanges}
                        saveMessage={saveMessage}
                        saveError={saveError}
                    />

                    <ChangePasswordForm
                        currentPassword={currentPassword}
                        newPassword={newPassword}
                        confirmPassword={confirmPassword}
                        onCurrentPasswordChange={setCurrentPassword}
                        onNewPasswordChange={setNewPassword}
                        onConfirmPasswordChange={setConfirmPassword}
                        onSubmit={handleChangePassword}
                        passwordMessage={passwordMessage}
                        passwordError={passwordError}
                    />

                </div>
            </div>
        </main>
    );
}
