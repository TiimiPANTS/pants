import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "../components/icons";
import { FormFooter, SelectField, TextField, type FormStatus } from "../components/FormFields";
import {
    OwnerShell,
    ROLE_ADMIN,
    ROLE_EMPLOYEE,
    ROLE_OWNER,
    focusRing,
    iconBtn,
    secondaryBtn,
    staffCard,
} from "../components/OwnerShell";
import { ApiError, createUser, fetchCurrentAccount } from "../services/accountApi";
import {
    PASSWORD_MIN,
    USERNAME_MAX,
    emailError,
    hasErrors,
    passwordLengthError,
    usernameError,
} from "../utils/accountValidation";

type Field = "username" | "email" | "password" | "roleId";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

const EMPTY: Values = { username: "", email: "", password: "", roleId: "" };

const USERS_URL = "/owner/usermanagement";

/** Expects username and email already trimmed. */
const validate = ({ username, email, password, roleId }: Values): Errors => ({
    username: usernameError(username),
    email: emailError(email),
    password: password ? passwordLengthError(password) : "Enter a password.",
    roleId: roleId ? undefined : "Choose a role.",
});

export default function AddUser() {
    const navigate = useNavigate();

    const [myRole, setMyRole] = useState<number | null>(null);
    const [values, setValues] = useState<Values>(EMPTY);
    const [errors, setErrors] = useState<Errors>({});
    const [status, setStatus] = useState<FormStatus>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCurrentAccount().then((me) => {
            if (!me) {
                navigate("/login");
                return;
            }
            const role = Number(me.roleId);
            // Employees are signed in but may not create accounts.
            if (role !== ROLE_ADMIN && role !== ROLE_OWNER) {
                navigate("/dashboard");
                return;
            }
            setMyRole(role);
        });
    }, [navigate]);

    const update = (field: Field, value: string) => {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setStatus(null);

        const user = { ...values, username: values.username.trim(), email: values.email.trim() };
        const found = validate(user);
        setErrors(found);
        if (hasErrors(found)) return;

        setSaving(true);
        try {
            await createUser({ ...user, roleId: Number(user.roleId) });
            setValues(EMPTY);
            setStatus({ ok: true, text: "User created successfully!" });
        } catch (error) {
            // 409 Conflict: another account already uses this email.
            if (error instanceof ApiError && error.status === 409) setErrors({ email: error.message });
            else setStatus({ ok: false, text: error instanceof Error ? error.message : "Could not create user." });
        } finally {
            setSaving(false);
        }
    };

    const backToUsers = () => navigate(USERS_URL);

    return (
        <OwnerShell
            active="users"
            mobileHeader={
                <div className="flex items-center gap-3">
                    <button type="button" onClick={backToUsers} aria-label="Back to users" className={iconBtn}>
                        <ChevronLeft />
                    </button>
                    <h1 className="text-[26px] font-semibold leading-8 text-white">New user</h1>
                </div>
            }
        >
            <header>
                <button
                    type="button"
                    onClick={backToUsers}
                    className={`-ml-1 hidden items-center gap-1 rounded pr-1 text-sm font-semibold text-zinc-300 hover:text-white md:inline-flex ${focusRing}`}
                >
                    <ChevronLeft />
                    Users
                </button>
                <h1 className="hidden text-4xl font-medium leading-11 text-white md:block">New user</h1>
                <p className="text-sm text-zinc-400 md:mt-1">Create a new user account</p>
            </header>

            {myRole === null ? (
                <p className="text-sm text-zinc-400">Loading…</p>
            ) : (
                <section aria-labelledby="new-user-h" className={`${staffCard} max-w-2xl`}>
                    <h2 id="new-user-h" className="text-lg font-semibold text-white">
                        User information
                    </h2>

                    <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <TextField
                                id="username"
                                label="Username"
                                autoComplete="off"
                                maxLength={USERNAME_MAX}
                                value={values.username}
                                onChange={(event) => update("username", event.target.value)}
                                error={errors.username}
                            />
                            <SelectField
                                id="role"
                                label="Role"
                                value={values.roleId}
                                onChange={(event) => update("roleId", event.target.value)}
                                error={errors.roleId}
                            >
                                <option value="">Select a role</option>
                                {myRole === ROLE_ADMIN && <option value={ROLE_ADMIN}>Admin</option>}
                                <option value={ROLE_OWNER}>Owner</option>
                                <option value={ROLE_EMPLOYEE}>Employee</option>
                            </SelectField>
                        </div>
                        <TextField
                            id="email"
                            label="Email address"
                            type="email"
                            autoComplete="off"
                            value={values.email}
                            onChange={(event) => update("email", event.target.value)}
                            hint="They sign in with this address."
                            error={errors.email}
                        />
                        <TextField
                            id="password"
                            label="Password"
                            type="password"
                            autoComplete="new-password"
                            value={values.password}
                            onChange={(event) => update("password", event.target.value)}
                            hint={`At least ${PASSWORD_MIN} characters. Share it with them privately.`}
                            error={errors.password}
                        />
                        <FormFooter label="Create user" busyLabel="Creating…" busy={saving} status={status}>
                            <button type="button" onClick={backToUsers} className={`${secondaryBtn} sm:self-start`}>
                                Cancel
                            </button>
                        </FormFooter>
                    </form>
                </section>
            )}
        </OwnerShell>
    );
}
