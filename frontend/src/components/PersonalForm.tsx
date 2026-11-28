import { fieldInput, fieldLabel, primaryBtn, staffCard } from "./OwnerShell";

type PersonalFormProps = {
  username: string;
  email: string;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
  saveMessage: string;
  saveError: boolean;
};

export default function PersonalForm({
  username,
  email,
  onUsernameChange,
  onEmailChange,
  onSave,
  saveMessage,
  saveError,
}: PersonalFormProps) {
  return (
    <section aria-labelledby="personal-h" className={staffCard}>
      <div>
        <h2 id="personal-h" className="text-lg font-semibold text-white">
          Personal information
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          How you appear to other staff and where we send account emails.
        </p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <div>
          <label htmlFor="username" className={fieldLabel}>
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="Enter username"
            className={fieldInput}
          />
        </div>

        <div>
          <label htmlFor="email" className={fieldLabel}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="Enter email address"
            className={fieldInput}
          />
        </div>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-4">
          <button type="submit" className={`${primaryBtn} sm:self-start`}>
            Save changes
          </button>

          {saveMessage && (
            <p
              role={saveError ? "alert" : "status"}
              className={`text-sm ${saveError ? "text-red-400" : "text-zinc-200"}`}
            >
              {saveMessage}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
