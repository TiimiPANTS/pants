import type { InputHTMLAttributes } from "react";
import { focusRing, primaryBtn } from "./OwnerShell";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    id: string;
    label: string;
    /** Help text under the field; replaced by the error when there is one. */
    hint?: string;
    error?: string;
};

/** Labelled staff form input with its hint or error underneath. */
export function TextField({ id, label, hint, error, ...input }: TextFieldProps) {
    const noteId = `${id}-note`;
    const note = error ?? hint;

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-semibold text-zinc-300">
                {label}
            </label>
            <input
                id={id}
                aria-invalid={error ? true : undefined}
                aria-describedby={note ? noteId : undefined}
                className={`h-12 w-full rounded border bg-dark-bg px-3.5 text-base text-white transition-colors placeholder:text-zinc-400 ${focusRing} ${
                    error ? "border-red-400" : "border-zinc-700 hover:border-zinc-500"
                }`}
                {...input}
            />
            {note && (
                <p id={noteId} className={`text-sm ${error ? "text-red-400" : "text-zinc-400"}`}>
                    {note}
                </p>
            )}
        </div>
    );
}

export type FormStatus = { ok: boolean; text: string } | null;

type FormFooterProps = {
    label: string;
    busyLabel: string;
    busy: boolean;
    status: FormStatus;
};

/** Hairline-separated submit row, with the result of the last submit next to the button. */
export function FormFooter({ label, busyLabel, busy, status }: FormFooterProps) {
    return (
        <div className="flex flex-col gap-3 border-t border-card-border pt-5 sm:flex-row sm:items-center sm:gap-4">
            <button type="submit" disabled={busy} className={`${primaryBtn} whitespace-nowrap disabled:opacity-60 sm:self-start`}>
                {busy ? busyLabel : label}
            </button>
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
