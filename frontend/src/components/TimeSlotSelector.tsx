import type { FC } from "react";
import { availableTimes } from "../types/reservation";
import type { ReservationTime } from "../types/reservation";

type TimeSlotSelectorProps = {
  selectedTime: ReservationTime;
  setSelectedTime: (time: ReservationTime) => void;
};

export const TimeSlotSelector: FC<TimeSlotSelectorProps> = ({
  selectedTime,
  setSelectedTime,
}) => {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-wine" />
        3. Select Time
      </h2>

      <div className="grid grid-cols-3 gap-2.5">
        {availableTimes.map((time) => {
          // You can eventually pass a list of disabled times as a prop based on backend availability
          const isDisabled = time === "19:00"; 
          const isSelected = time === selectedTime;

          return (
            <button
              key={time}
              disabled={isDisabled}
              type="button"
              onClick={() => setSelectedTime(time)}
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
  );
};