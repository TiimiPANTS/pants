import { useState, type FormEvent } from "react";
import { changePassword } from "../services/accountApi";
import { FormFooter, TextField, type FormStatus } from "./FormFields";
import { staffCard } from "./OwnerShell";

type Field = "currentPassword" | "newPassword" | "confirmPassword";
type Passwords = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

// Same limits as the backend's PasswordChangeRequestDTO.
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 72;

// Message from UserController.changePassword.
const WRONG_CURRENT_PASSWORD = "Current password is incorrect";

const EMPTY: Passwords = { currentPassword: "", newPassword: "", confirmPassword: "" };

function validate({ currentPassword, newPassword, confirmPassword }: Passwords): Errors {
    const errors: Errors = {};

    if (!currentPassword) errors.currentPassword = "Enter your current password.";

    if (!newPassword) errors.newPassword = "Enter a new password.";
    else if (newPassword.length < PASSWORD_MIN) errors.newPassword = `Use at least ${PASSWORD_MIN} characters.`;
    else if (newPassword.length > PASSWORD_MAX) errors.newPassword = `Use at most ${PASSWORD_MAX} characters.`;
    else if (newPassword === currentPassword) errors.newPassword = "New password must be different from current password.";

    if (!confirmPassword) errors.confirmPassword = "Enter the new password again.";
    else if (confirmPassword !== newPassword) errors.confirmPassword = "New passwords do not match.";

    return errors;
}

export default function ChangePasswordForm() {
    const [passwords, setPasswords] = useState<Passwords>(EMPTY);
    const [errors, setErrors] = useState<Errors>({});
    const [status, setStatus] = useState<FormStatus>(null);
    const [saving, setSaving] = useState(false);

    const update = (field: Field, value: string) => {
        setPasswords((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setStatus(null);

        const found = validate(passwords);
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSaving(true);
        try {
            await changePassword(passwords.currentPassword, passwords.newPassword);
            setPasswords(EMPTY);
            setStatus({ ok: true, text: "Password updated successfully!" });
        } catch (error) {
            const text = error instanceof Error ? error.message : "Could not update password.";
            // The backend answers 400 for both bad input and a wrong current password; only the message tells them apart.
            if (text === WRONG_CURRENT_PASSWORD) setErrors({ currentPassword: text });
            else setStatus({ ok: false, text });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section aria-labelledby="password-h" className={staffCard}>
            <h2 id="password-h" className="text-lg font-semibold text-white">
                Change password
            </h2>

            <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <TextField
                    id="currentPassword"
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={passwords.currentPassword}
                    onChange={(event) => update("currentPassword", event.target.value)}
                    error={errors.currentPassword}
                />
                <TextField
                    id="newPassword"
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.newPassword}
                    onChange={(event) => update("newPassword", event.target.value)}
                    hint={`At least ${PASSWORD_MIN} characters.`}
                    error={errors.newPassword}
                />
                <TextField
                    id="confirmPassword"
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    value={passwords.confirmPassword}
                    onChange={(event) => update("confirmPassword", event.target.value)}
                    error={errors.confirmPassword}
                />
                <FormFooter label="Update password" busyLabel="Updating…" busy={saving} status={status} />
            </form>
        </section>
    );
}
