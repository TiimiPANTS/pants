import type { FC, ChangeEvent } from "react";
import type { ReservationForm } from "../types/reservation";

type ContactDetailsProps = {
  form: ReservationForm;
  handleInputChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
};

export const ContactDetails: FC<ContactDetailsProps> = ({
  form,
  handleInputChange,
}) => {
  return (
    <>
      <section className="border-t border-zinc-800/80 pt-6">
        <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-wine" />
          4. Contact Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-semibold text-zinc-200 mb-1.5"
              htmlFor="first_name"
            >
              First Name
            </label>
            <input
              id="first_name"
              name="firstName"
              type="text"
              required
              value={form.firstName}
              onChange={handleInputChange}
              className="w-full bg-surface-input border border-zinc-700 rounded-lg px-3.5 py-3 text-white"
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold text-zinc-200 mb-1.5"
              htmlFor="last_name"
            >
              Last Name
            </label>
            <input
              id="last_name"
              name="lastName"
              type="text"
              required
              value={form.lastName}
              onChange={handleInputChange}
              className="w-full bg-surface-input border border-zinc-700 rounded-lg px-3.5 py-3 text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              className="block text-sm font-semibold text-zinc-200 mb-1.5"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleInputChange}
              className="w-full bg-surface-input border border-zinc-700 rounded-lg px-3.5 py-3 text-white"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800/80 pt-6">
        <label
          className="block text-xs uppercase tracking-widest font-bold text-zinc-300 mb-1.5"
          htmlFor="specialRequests"
        >
          Special Requests
        </label>
        <textarea
          id="specialRequests"
          name="specialRequests"
          rows={3}
          value={form.specialRequests}
          onChange={handleInputChange}
          className="w-full bg-surface-input border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white resize-none"
        />
      </section>
    </>
  );
};