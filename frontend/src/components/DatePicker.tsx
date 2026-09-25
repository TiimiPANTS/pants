import type { FC } from "react";
import { useState } from "react";
import { DayPicker } from "@daypicker/react";
import "@daypicker/react/style.css";

type DatePickerProps = {
  selectedDay: Date | undefined;
  setSelectedDay: (date: Date) => void;
  bookedDays: Set<number>;
};

export const DatePicker: FC<DatePickerProps> = ({
  selectedDay,
  setSelectedDay,
  bookedDays,
}) => {

  const [currentMonth, setCurrentMonth] = useState(new Date());
  //const [selectedDate, setSelectedDate] = useState<Date | undefined>();

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

  const bookedDates = Array.from(bookedDays).map(
    (day) =>
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      )
  );

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

        <DayPicker
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          // selected={selectedDate}
          // onSelect={(date) => {
          //   setSelectedDate(date);
          //   if (date) {
          //     setSelectedDay(date.getDate());
          //   }
          // }}
          selected={selectedDay}
          onSelect={(date) => {
            if (date) {
              setSelectedDay(date);
            }
          }}
          showOutsideDays
          weekStartsOn={1}
          modifiers={{
            booked: bookedDates,
          }}
          disabled={[
            { before: new Date() },
            ...bookedDates,
          ]}
          modifiersClassNames={{
            booked:
              "bg-zinc-900/40 text-zinc-500 cursor-not-allowed border border-zinc-800/40 rounded-lg",
          }}
          classNames={{
            month_caption: "hidden",
            button_previous: "hidden",
            button_next: "hidden",

            outside: "text-zinc-600",
            today: "text-white font-bold bg-zinc-800 rounded-lg",
            selected: "min-h-[44px] min-w-[60px] flex items-center justify-center text-sm font-bold text-white !bg-wine rounded-lg shadow-md ring-2 ring-wine-light/60",
            day_button: "text-sm min-w-[60px] min-h-[44px] aria-disabled:line-through",
          }}
        />

      </div>
    </section>
  );
};