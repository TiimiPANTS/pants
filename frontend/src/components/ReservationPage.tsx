import { useState } from "react";
import type { ChangeEvent } from "react";

const bookedDays = new Set([4, 5, 11, 12, 18, 19, 25, 26]);

const availableTimes = [
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
] as const;

type ReservationTime = (typeof availableTimes)[number];

type ReservationForm = {
  firstName: string;
  lastName: string;
  email: string;
  specialRequests: string;
};

const dayButtonClass =
  "min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-semibold text-[#F4F4F5] hover:bg-zinc-800 hover:text-white rounded-lg transition-colors focus:ring-2 focus:ring-wine focus:outline-none";

export default function ReservationPage() {
  const [selectedDay, setSelectedDay] = useState<number>(21);
  const [selectedTime, setSelectedTime] = useState<ReservationTime>(
    "19:30"
  );

  const [guestCount, setGuestCount] = useState<number>(2);

  const [form, setForm] = useState<ReservationForm>({
    firstName: "",
    lastName: "",
    email: "",
    specialRequests: "",
  });

  const updateGuestCount = (value: number) => {
    const safeValue = Number.isNaN(value)
      ? 2
      : Math.min(10, Math.max(1, value));

    setGuestCount(safeValue);
  };

  const handleGuestChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateGuestCount(Number.parseInt(event.target.value, 10));
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    const reservation = {
      date: `2026-09-${String(selectedDay).padStart(2, "0")}`,
      time: selectedTime,
      partySize: guestCount,
      ...form,
    };

    console.log("Reservation:", reservation);
  };

  return (
    <div className="antialiased min-h-screen flex flex-col bg-dark-bg text-white font-sans selection:bg-wine selection:text-white">
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-36 flex flex-col">
        <header className="flex flex-col items-center text-center mb-7">
          <div className="relative w-20 h-20 mb-3 rounded-full overflow-hidden p-0.5 bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-xl border border-zinc-700/60">
            <img
              alt="Le Pants logo"
              className="w-full h-full object-cover rounded-full"
              src="https://lh3.googleusercontent.com/aida/AEtjO1W0brRzApeTH9TKPsUBdBI1drLdEl1HxqPGjTnitjcTnV1Md4Y0x6YtAaFlWsZNtZMgOrsjJsgWw1AN0AzF6viZjCAW2L5rWNSoxqxNLLS4K8ebbTQTAvu3pcqA5p94bt6TWEQB0bJSy6EyXSrAD8OnE35c-azcSLN4psWm26mDMcbfz5NJONRrmqCy48QBxTV1_qMdBTnKQq8R5F05eMWKOYMLiNcdhxojJASfkstm5UfxI6tCBv2Lr3uWI5fyFdZNRBf3U-k"
            />
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl text-white font-bold tracking-tight mb-2">
            Le Pants
          </h1>

          <div className="h-0.5 w-12 bg-wine rounded-full" />
        </header>

        <form
          id="reservationForm"
          className="bg-card-bg border border-card-border rounded-2xl p-5 sm:p-7 shadow-2xl space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <section aria-labelledby="heading-date">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2"
                id="heading-date"
              >
                <span className="w-2 h-2 rounded-full bg-wine" />
                1. Select Date
              </h2>

              <span className="text-sm font-semibold text-zinc-300">
                September 2026
              </span>
            </div>

            <div className="bg-[#141519] border border-zinc-800/90 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                <button
                  aria-label="Previous month"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-wine"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_left
                  </span>
                </button>

                <span className="text-base font-semibold text-white tracking-wide">
                  September 2026
                </span>

                <button
                  aria-label="Next month"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-wine"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    chevron_right
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                {[
                  "Mo",
                  "Tu",
                  "We",
                  "Th",
                  "Fr",
                  "Sa",
                  "Su",
                ].map((day) => (
                  <span
                    key={day}
                    className="text-xs font-bold text-zinc-400 py-1"
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                <span className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-zinc-600 select-none cursor-not-allowed">
                  31
                </span>

                {Array.from(
                  { length: 30 },
                  (_, index) => index + 1
                ).map((day) => {
                  if (bookedDays.has(day)) {
                    return (
                      <div
                        key={day}
                        className="min-h-[44px] min-w-[44px] relative flex flex-col items-center justify-center rounded-lg bg-zinc-900/40 text-zinc-500 cursor-not-allowed border border-zinc-800/40"
                        title="Fully Booked"
                      >
                        <span className="text-xs line-through text-zinc-500">
                          {day}
                        </span>

                        <span className="text-[10px] font-bold text-rose-400 absolute top-0.5 right-1">
                          ✕
                        </span>
                      </div>
                    );
                  }

                  const isSelected =
                    day === selectedDay;

                  return (
                    <button
                      key={day}
                      aria-pressed={isSelected}
                      className={
                        isSelected
                          ? "min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-bold text-white bg-wine rounded-lg shadow-md ring-2 ring-wine-light/60 focus:outline-none"
                          : dayButtonClass
                      }
                      type="button"
                      onClick={() =>
                        setSelectedDay(day)
                      }
                    >
                      {day}
                    </button>
                  );
                })}

                {[1, 2, 3, 4].map((day) => (
                  <span
                    key={`oct-${day}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-zinc-600 select-none cursor-not-allowed"
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-center gap-4 text-xs text-zinc-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-wine inline-block" />
                  <span>Selected</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400 font-bold text-xs">
                    ✕
                  </span>
                  <span>Fully Booked</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700 inline-block" />
                  <span>Available</span>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="heading-party">
            <div className="flex items-center justify-between mb-2">
              <h2
                className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2"
                id="heading-party"
              >
                <span className="w-2 h-2 rounded-full bg-wine" />
                2. Party Size
              </h2>

              <span className="text-xs text-zinc-400 font-medium">
                {guestCount}{" "}
                {guestCount === 1
                  ? "Guest"
                  : "Guests"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                aria-label="Decrease party size"
                className="w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:border-wine hover:bg-zinc-800 text-white rounded-xl text-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-wine"
                type="button"
                onClick={() =>
                  updateGuestCount(
                    guestCount - 1
                  )
                }
              >
                −
              </button>

              <div className="flex-1 relative">
                <input
                  aria-label="Party Size"
                  className="w-full h-12 bg-surface-input border border-zinc-700 rounded-xl px-4 text-center text-lg font-bold text-white focus:border-wine focus:ring-2 focus:ring-wine/50 focus:outline-none transition-all"
                  max={10}
                  min={1}
                  type="number"
                  value={guestCount}
                  onChange={handleGuestChange}
                />
              </div>

              <button
                aria-label="Increase party size"
                className="w-12 h-12 min-w-[44px] min-h-[44px] flex items-center justify-center bg-zinc-900 border border-zinc-700 hover:border-wine hover:bg-zinc-800 text-white rounded-xl text-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-wine"
                type="button"
                onClick={() =>
                  updateGuestCount(
                    guestCount + 1
                  )
                }
              >
                +
              </button>
            </div>

            <p className="text-xs text-zinc-400 mt-2">
              Max 10 guests. For groups larger
              than 10, please contact the
              restaurant directly.
            </p>
          </section>

          <section aria-labelledby="heading-time">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2"
                id="heading-time"
              >
                <span className="w-2 h-2 rounded-full bg-wine" />
                3. Select Time
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {availableTimes.map((time) => {
                const isDisabled =
                  time === "19:00";

                const isSelected =
                  time === selectedTime;

                return (
                  <button
                    key={time}
                    aria-pressed={
                      isDisabled
                        ? undefined
                        : isSelected
                    }
                    className={
                      isDisabled
                        ? "min-h-[44px] py-2.5 px-3 border border-zinc-800 bg-zinc-900/20 rounded-lg text-sm font-medium text-zinc-600 cursor-not-allowed line-through"
                        : isSelected
                        ? "min-h-[44px] py-2.5 px-3 border-2 border-wine bg-wine rounded-lg text-sm font-bold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
                        : "min-h-[44px] py-2.5 px-3 border border-zinc-700 bg-zinc-900/60 rounded-lg text-sm font-semibold text-zinc-200 hover:border-wine hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-wine"
                    }
                    disabled={isDisabled}
                    type="button"
                    onClick={() =>
                      setSelectedTime(time)
                    }
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="heading-contact"
            className="border-t border-zinc-800/80 pt-6"
          >
            <h2
              className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2 mb-4"
              id="heading-contact"
            >
              <span className="w-2 h-2 rounded-full bg-wine" />
              4. Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-semibold text-zinc-200 mb-1.5"
                  htmlFor="first_name"
                >
                  First Name{" "}
                  <span className="text-rose-400">
                    *
                  </span>
                </label>

                <input
                  className="w-full bg-surface-input border border-zinc-700 rounded-lg px-3.5 py-3 text-white text-base placeholder:text-zinc-500 focus:border-wine focus:ring-2 focus:ring-wine/50 focus:outline-none transition-all"
                  id="first_name"
                  name="firstName"
                  placeholder="Enter first name"
                  required
                  type="text"
                  value={form.firstName}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold text-zinc-200 mb-1.5"
                  htmlFor="last_name"
                >
                  Last Name{" "}
                  <span className="text-rose-400">
                    *
                  </span>
                </label>

                <input
                  className="w-full bg-surface-input border border-zinc-700 rounded-lg px-3.5 py-3 text-white text-base placeholder:text-zinc-500 focus:border-wine focus:ring-2 focus:ring-wine/50 focus:outline-none transition-all"
                  id="last_name"
                  name="lastName"
                  placeholder="Enter last name"
                  required
                  type="text"
                  value={form.lastName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  className="block text-sm font-semibold text-zinc-200 mb-1.5"
                  htmlFor="email_address"
                >
                  Email{" "}
                  <span className="text-rose-400">
                    *
                  </span>
                </label>

                <input
                  className="w-full bg-surface-input border border-zinc-700 rounded-lg px-3.5 py-3 text-white text-base placeholder:text-zinc-500 focus:border-wine focus:ring-2 focus:ring-wine/50 focus:outline-none transition-all"
                  id="email_address"
                  name="email"
                  placeholder="name@domain.com"
                  required
                  type="email"
                  value={form.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </section>

          <section
            aria-labelledby="heading-requests"
            className="border-t border-zinc-800/80 pt-6"
          >
            <label
              className="block text-xs uppercase tracking-widest font-bold text-zinc-300 mb-1.5"
              htmlFor="special_requests"
              id="heading-requests"
            >
              Special Requests (optional)
            </label>

            <textarea
              className="w-full bg-surface-input border border-zinc-700 rounded-lg px-3.5 py-2.5 text-white text-base placeholder:text-zinc-500 focus:border-wine focus:ring-2 focus:ring-wine/50 focus:outline-none transition-all resize-none"
              id="special_requests"
              name="specialRequests"
              placeholder="Any dietary requirements or special requests"
              rows={3}
              value={form.specialRequests}
              onChange={handleInputChange}
            />
          </section>
        </form>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-[#121316]/95 backdrop-blur-xl border-t border-zinc-800 px-4 py-4 z-40">
        <div className="w-full max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-200 font-medium">
            <span className="material-symbols-outlined text-wine text-[20px]">
              calendar_month
            </span>

            <span>
              Sep {selectedDay}, 2026 •{" "}
              {selectedTime} •{" "}
              {guestCount}{" "}
              {guestCount === 1
                ? "guest"
                : "guests"}
            </span>
          </div>

          <button
            className="w-full sm:w-auto min-h-[48px] px-7 bg-wine hover:bg-wine-hover active:bg-wine-dark text-white font-bold text-sm sm:text-base uppercase tracking-wider rounded-xl shadow-lg shadow-wine/25 border border-wine-light/30 flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-wine text-center"
            type="submit"
            form="reservationForm"
          >
            <span>
              Confirm Reservation
            </span>

            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}