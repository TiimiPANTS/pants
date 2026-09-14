/* import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App */


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

function App() {
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState<string | null>(null);

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

  const calculateEndTime = (startTime: ReservationTime) => {
    const [hours, minutes] = startTime.split(":").map(Number);

    const endHours = (hours + 2) % 24;

    return `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:00`;
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const reservationData = {
      customer: {
        firstname: form.firstName,
        lastname: form.lastName,
        email: form.email,
      },

      datetime: `2026-09-${String(selectedDay).padStart(
        2,
        "0"
      )}T${selectedTime}:00`,

      startTime: `${selectedTime}:00`,

      endTime: calculateEndTime(selectedTime),

      partySize: guestCount,

      details: form.specialRequests,
    };

    try {
      const response = await fetch("http://localhost:8080/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.message || `Reservation failed: ${response.status}`
        );
      }

      const createdReservation = await response.json();

      console.log("Reservation created:", createdReservation);

      setMessage("Reservation created successfully!");

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        specialRequests: "",
      });

      setGuestCount(2);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to create reservation.");
      }
    } finally {
      setIsSubmitting(false);
    }
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

          <section>
            <div className="flex items-center justify-between mb-3">

              <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2">
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
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  type="button"
                >
                  ‹
                </button>

                <span className="text-base font-semibold text-white tracking-wide">
                  September 2026
                </span>

                <button
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  type="button"
                >
                  ›
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

                <span className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-zinc-600">
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
                      >
                        <span className="text-xs line-through">
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
                      type="button"
                      onClick={() =>
                        setSelectedDay(day)
                      }
                      className={
                        isSelected
                          ? "min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-bold text-white bg-wine rounded-lg shadow-md ring-2 ring-wine-light/60"
                          : dayButtonClass
                      }
                    >
                      {day}
                    </button>
                  );
                })}

                {[1, 2, 3, 4].map((day) => (
                  <span
                    key={`oct-${day}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-zinc-600"
                  >
                    {day}
                  </span>
                ))}

              </div>
            </div>
          </section>

          <section>

            <div className="flex items-center justify-between mb-2">

              <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2">
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
                type="button"
                className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl text-xl font-bold"
                onClick={() =>
                  updateGuestCount(
                    guestCount - 1
                  )
                }
              >
                −
              </button>

              <input
                className="w-full h-12 bg-surface-input border border-zinc-700 rounded-xl px-4 text-center text-lg font-bold text-white"
                max={10}
                min={1}
                type="number"
                value={guestCount}
                onChange={handleGuestChange}
              />

              <button
                type="button"
                className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl text-xl font-bold"
                onClick={() =>
                  updateGuestCount(
                    guestCount + 1
                  )
                }
              >
                +
              </button>

            </div>
          </section>

          <section>

            <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-wine" />
              3. Select Time
            </h2>

            <div className="grid grid-cols-3 gap-2.5">

              {availableTimes.map((time) => {
                const isDisabled =
                  time === "19:00";

                const isSelected =
                  time === selectedTime;

                return (
                  <button
                    key={time}
                    disabled={isDisabled}
                    type="button"
                    onClick={() =>
                      setSelectedTime(time)
                    }
                    className={
                      isDisabled
                        ? "min-h-[44px] py-2.5 px-3 border border-zinc-800 bg-zinc-900/20 rounded-lg text-sm text-zinc-600 line-through"
                        : isSelected
                        ? "min-h-[44px] py-2.5 px-3 border-2 border-wine bg-wine rounded-lg text-sm font-bold text-white"
                        : "min-h-[44px] py-2.5 px-3 border border-zinc-700 bg-zinc-900/60 rounded-lg text-sm font-semibold text-zinc-200"
                    }
                  >
                    {time}
                  </button>
                );
              })}

            </div>
          </section>

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

          {error && (
            <p className="text-red-400 text-sm">
              {error}
            </p>
          )}

          {message && (
            <p className="text-green-400 text-sm">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] px-7 bg-wine hover:bg-wine-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase rounded-xl"
          >
            {isSubmitting
              ? "Creating reservation..."
              : "Confirm Reservation"}
          </button>

        </form>
      </main>
    </div>
  );
}

export default App;