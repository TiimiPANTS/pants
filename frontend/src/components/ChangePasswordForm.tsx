type ChangePasswordFormProps = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  passwordMessage: string;
  passwordError: boolean;
};

export default function ChangePasswordForm({
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  passwordMessage,
  passwordError,
}: ChangePasswordFormProps) {
  return (
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
            value={currentPassword}
            onChange={(event) =>
              onCurrentPasswordChange(event.target.value)
            }
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
            value={newPassword}
            onChange={(event) =>
              onNewPasswordChange(event.target.value)
            }
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
            value={confirmPassword}
            onChange={(event) =>
              onConfirmPasswordChange(event.target.value)
            }
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
            onClick={onSubmit}
          >
            Update password
          </button>
          {passwordMessage && (
            <p
              className={`mt-3 text-sm ${passwordError ? "text-red-400" : "text-white"}`}
            >
              {passwordMessage}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}