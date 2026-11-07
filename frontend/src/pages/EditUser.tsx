import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChangePasswordForm from "../components/ChangePasswordForm";
import PersonalForm from "../components/PersonalForm";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export default function EditUser() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState(false);

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
    const loadUser = async () => {
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          credentials: "include",
        });

        if (response.status === 401 || response.status === 403) {
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load account information.");
        }

        const user = await response.json();

        setUserId(user.id);
        setUsername(user.username);
        setEmail(user.email);

      } catch (error) {
        console.error("Failed to load account information:", error);
        navigate("/login");
      }
    };

    loadUser();
  }, [navigate]);

  const handleSaveChanges = async () => {
    setSaveMessage("");
    setSaveError(false);

    if (userId === null) {
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

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [csrfData.headerName]: csrfData.token,
        },
        body: JSON.stringify({
          username,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Could not update account information."
        );
      }

      const updatedUser = await response.json();

      setUsername(updatedUser.username);
      setEmail(updatedUser.email);

      setSaveError(false);
      setSaveMessage("Account information updated successfully");

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

  const handleChangePassword = async () => {
    setPasswordMessage("");
    setPasswordError(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(true);
      setPasswordMessage("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(true);
      setPasswordMessage("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(true);
      setPasswordMessage("New password must be different from current password.");
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

      const response = await fetch(`${API_URL}/users/me/password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [csrfData.headerName]: csrfData.token,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Could not update password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordError(false);
      setPasswordMessage("Password updated successfully!");

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