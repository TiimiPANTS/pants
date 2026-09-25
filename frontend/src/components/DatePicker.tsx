import type { FC } from "react";
import { useState } from "react";
// import { DayPicker } from "@daypicker/react";
// import "@daypicker/react/style.css";

type DatePickerProps = {
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  bookedDays: Set<number>;
};

const dayButtonClass =
  "min-h-[44px] min-w-[44px] flex items-center justify-center text-sm font-semibold text-[#F4F4F5] hover:bg-zinc-800 hover:text-white rounded-lg transition-colors focus:ring-2 focus:ring-wine focus:outline-none";

export const DatePicker: FC<DatePickerProps> = ({
  selectedDay,
  setSelectedDay,
  bookedDays,
}) => {

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  };

  const monthYear = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-wine" />
          1. Select Date
        </h2>
        <span className="text-sm font-semibold text-zinc-300">
          {monthYear}
        </span>
      </div>

      <div className="bg-[#141519] border border-zinc-800/90 rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            type="button"
            onClick={goToPreviousMonth}
          >
            ‹
          </button>
          <span className="text-base font-semibold text-white tracking-wide">
            {monthYear}
          </span>
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            type="button"
            onClick={goToNextMonth}
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
            <span key={day} className="text-xs font-bold text-zinc-400 py-1">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          <span className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-zinc-600">
            31
          </span>

          {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => {
            if (bookedDays.has(day)) {
              return (
                <div
                  key={day}
                  className="min-h-[44px] min-w-[44px] relative flex flex-col items-center justify-center rounded-lg bg-zinc-900/40 text-zinc-500 cursor-not-allowed border border-zinc-800/40"
                >
                  <span className="text-xs line-through">{day}</span>
                  <span className="text-[10px] font-bold text-rose-400 absolute top-0.5 right-1">
                    ✕
                  </span>
                </div>
              );
            }

            const isSelected = day === selectedDay;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
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
  );
};