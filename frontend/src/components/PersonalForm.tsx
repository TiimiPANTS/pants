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
    <section className="rounded-xl border border-card-border bg-card-bg p-6">
      <h2 className="mb-6 font-headline text-xl font-semibold">
        Personal information
      </h2>

      <form className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm text-zinc-300"
          >
            Username
          </label>
          <input
            id="name"
            type="text"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="Enter username"
            className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm text-zinc-300"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="Enter email address"
            className="w-full rounded-lg border border-card-border bg-dark-bg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Save changes
          </button>

          {saveMessage && (
            <p
              className={`mt-3 text-sm ${saveError ? "text-red-400" : "text-white"}`}
            >
              {saveMessage}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}