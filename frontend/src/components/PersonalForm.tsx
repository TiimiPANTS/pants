import { useState, type FormEvent } from "react";
import { ApiError, updateAccount, type Account } from "../services/accountApi";
import { FormFooter, TextField, type FormStatus } from "./FormFields";
import { staffCard } from "./OwnerShell";

type Field = "username" | "email";
type Errors = Partial<Record<Field, string>>;

// Same limits as the backend's UserUpdateDTO.
const USERNAME_MAX = 50;
const EMAIL_MAX = 254;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(username: string, email: string): Errors {
    const errors: Errors = {};

    if (!username) errors.username = "Enter a username.";
    else if (username.length > USERNAME_MAX) errors.username = `Use at most ${USERNAME_MAX} characters.`;

    if (!email) errors.email = "Enter an email address.";
    else if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX) errors.email = "Enter a valid email address, like name@example.com.";

    return errors;
}

export default function PersonalForm({ account }: { account: Account }) {
    const [username, setUsername] = useState(account.username);
    const [email, setEmail] = useState(account.email);
    const [errors, setErrors] = useState<Errors>({});
    const [status, setStatus] = useState<FormStatus>(null);
    const [saving, setSaving] = useState(false);

    const clearError = (field: Field) => setErrors((current) => ({ ...current, [field]: undefined }));

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setStatus(null);

        const changes = { username: username.trim(), email: email.trim() };
        const found = validate(changes.username, changes.email);
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSaving(true);
        try {
            const updated = await updateAccount(account.id, changes);
            setUsername(updated.username);
            setEmail(updated.email);
            setStatus({ ok: true, text: "Account information updated successfully" });
        } catch (error) {
            // 409 Conflict: another account already uses this email.
            if (error instanceof ApiError && error.status === 409) setErrors({ email: error.message });
            else setStatus({ ok: false, text: error instanceof Error ? error.message : "Could not update account information." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <section aria-labelledby="personal-h" className={staffCard}>
            <h2 id="personal-h" className="text-lg font-semibold text-white">
                Personal information
            </h2>

            <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <TextField
                    id="username"
                    label="Username"
                    autoComplete="username"
                    maxLength={USERNAME_MAX}
                    value={username}
                    onChange={(event) => {
                        setUsername(event.target.value);
                        clearError("username");
                    }}
                    error={errors.username}
                />
                <TextField
                    id="email"
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                        setEmail(event.target.value);
                        clearError("email");
                    }}
                    hint="You sign in with this address."
                    error={errors.email}
                />
                <FormFooter label="Save changes" busyLabel="Saving…" busy={saving} status={status} />
            </form>
        </section>
    );
}
