import type { FC, ChangeEvent } from "react";

type PartySizeSelectorProps = {
  guestCount: number;
  updateGuestCount: (value: number) => void;
  handleGuestChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const PartySizeSelector: FC<PartySizeSelectorProps> = ({
  guestCount,
  updateGuestCount,
  handleGuestChange,
}) => {
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
          className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl text-xl font-bold hover:bg-zinc-800 transition-colors"
          onClick={() => updateGuestCount(guestCount - 1)}
        >
          −
        </button>

        <input
          className="w-full h-12 bg-surface-input border border-zinc-700 rounded-xl px-4 text-center text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-wine"
          max={10}
          min={1}
          type="number"
          value={guestCount}
          onChange={handleGuestChange}
        />

        <button
          type="button"
          className="w-12 h-12 bg-zinc-900 border border-zinc-700 rounded-xl text-xl font-bold hover:bg-zinc-800 transition-colors"
          onClick={() => updateGuestCount(guestCount + 1)}
        >
          +
        </button>
      </div>
    </section>
  );
};