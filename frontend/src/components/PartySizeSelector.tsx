import { useState } from "react";
import type { FC, ChangeEvent } from "react";
import { MAX_PARTY_SIZE, MIN_PARTY_SIZE } from "../types/reservation";

type PartySizeSelectorProps = {
  guestCount: number;
  updateGuestCount: (value: number) => void;
};

export const PartySizeSelector: FC<PartySizeSelectorProps> = ({
  guestCount,
  updateGuestCount,
}) => {
  const [draft, setDraft] = useState<string | null>(null);
  const displayValue = draft ?? String(guestCount);

  const step = (delta: number) => {
    setDraft(null);
    updateGuestCount(guestCount + delta);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
    setDraft(digits);

    const parsed = Number.parseInt(digits, 10);
    if (parsed >= MIN_PARTY_SIZE && parsed <= MAX_PARTY_SIZE) {
      updateGuestCount(parsed);
    }
  };

  const commit = () => {
    const parsed = Number.parseInt(displayValue, 10);
    const next = Number.isNaN(parsed)
      ? guestCount
      : Math.min(MAX_PARTY_SIZE, Math.max(MIN_PARTY_SIZE, parsed));
    updateGuestCount(next);
    setDraft(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-wine" />
          2. Party Size
        </h2>

        <span className="text-xs text-zinc-400 font-medium">
          {guestCount} {guestCount === 1 ? "Guest" : "Guests"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={guestCount <= MIN_PARTY_SIZE}
          className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl text-xl font-bold enabled:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-default"
          onClick={() => step(-1)}
        >
          −
        </button>

        <input
          className="w-full h-12 bg-surface-input border border-zinc-700 rounded-xl px-4 text-center text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-wine [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label="Number of guests"
          inputMode="numeric"
          max={MAX_PARTY_SIZE}
          min={MIN_PARTY_SIZE}
          type="number"
          value={displayValue}
          onChange={handleChange}
          onFocus={(event) => event.target.select()}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
        />

        <button
          type="button"
          disabled={guestCount >= MAX_PARTY_SIZE}
          className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl text-xl font-bold enabled:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-default"
          onClick={() => step(1)}
        >
          +
        </button>
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        Type a number or use + / −. Up to {MAX_PARTY_SIZE} guests.
      </p>
    </section>
  );
};
