import { btn, fieldInput, fieldLabel, staffCard } from "./OwnerShell";

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
    <section aria-labelledby="password-h" className={staffCard}>
      <div>
        <h2 id="password-h" className="text-lg font-semibold text-white">
          Change password
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your current password, then choose a new one.
        </p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div>
          <label htmlFor="currentPassword" className={fieldLabel}>
            Current password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            placeholder="Enter current password"
            className={fieldInput}
            value={currentPassword}
            onChange={(event) => onCurrentPasswordChange(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="newPassword" className={fieldLabel}>
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Enter new password"
            className={fieldInput}
            value={newPassword}
            onChange={(event) => onNewPasswordChange(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className={fieldLabel}>
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm new password"
            className={fieldInput}
            value={confirmPassword}
            onChange={(event) => onConfirmPasswordChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-4">
          {/* Ghost button: "Save changes" is the page's one primary action. */}
          <button type="submit" className={`${btn} min-h-12 sm:self-start`}>
            Update password
          </button>

          {passwordMessage && (
            <p
              role={passwordError ? "alert" : "status"}
              className={`text-sm ${passwordError ? "text-red-400" : "text-zinc-200"}`}
            >
              {passwordMessage}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
