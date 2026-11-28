import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "./icons";
import { focusRing, primaryBtn } from "./OwnerShell";

/** What every labelled staff field takes besides its own element's props. */
type FieldProps = {
    id: string;
    label: string;
    /** Help text under the field; replaced by the error when there is one. */
    hint?: string;
    error?: string;
};

const noteId = (id: string) => `${id}-note`;

/** id and ARIA attributes that tie a control to its label and note. */
const controlProps = ({ id, hint, error }: FieldProps) => ({
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": (error ?? hint) ? noteId(id) : undefined,
});

const fieldBox = (error?: string) =>
    `h-12 w-full rounded border bg-dark-bg px-3.5 text-base text-white transition-colors placeholder:text-zinc-400 ${focusRing} ${
        error ? "border-red-400" : "border-zinc-700 hover:border-zinc-500"
    }`;

/** Label above the control, hint or error below it. */
function Field({ id, label, hint, error, children }: FieldProps & { children: ReactNode }) {
    const note = error ?? hint;

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-semibold text-zinc-300">
                {label}
            </label>
            {children}
            {note && (
                <p id={noteId(id)} className={`text-sm ${error ? "text-red-400" : "text-zinc-400"}`}>
                    {note}
                </p>
            )}
        </div>
    );
}

/** Labelled staff form input with its hint or error underneath. */
export function TextField({ id, label, hint, error, ...input }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
    const field = { id, label, hint, error };

    return (
        <Field {...field}>
            <input {...controlProps(field)} className={fieldBox(error)} {...input} />
        </Field>
    );
}

/** Labelled staff form dropdown, styled like TextField. */
export function SelectField({
    id,
    label,
    hint,
    error,
    children,
    ...select
}: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
    const field = { id, label, hint, error };

    return (
        <Field {...field}>
            <div className="relative">
                <select {...controlProps(field)} className={`${fieldBox(error)} appearance-none pr-10`} {...select}>
                    {children}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            </div>
        </Field>
    );
}

export type FormStatus = { ok: boolean; text: string } | null;

type FormFooterProps = {
    label: string;
    busyLabel: string;
    busy: boolean;
    status: FormStatus;
    /** Extra buttons next to the submit button, such as Cancel. */
    children?: ReactNode;
};

/** Hairline-separated submit row, with the result of the last submit next to the button. */
export function FormFooter({ label, busyLabel, busy, status, children }: FormFooterProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-card-border pt-5 sm:flex-row sm:items-center sm:gap-4">
            <button type="submit" disabled={busy} className={`${primaryBtn} whitespace-nowrap disabled:opacity-60 sm:self-start`}>
                {busy ? busyLabel : label}
            </button>
            {children}
            {status && (
                <p
                    role={status.ok ? "status" : "alert"}
                    className={`text-sm ${status.ok ? "text-zinc-200" : "text-red-400"}`}
                >
                    {status.text}
                </p>
            )}
        </div>
    );
}
