import type { FC } from "react";
import { useEffect, useState } from "react";
import "@daypicker/react/style.css";
import { DayPicker, DayButton, type DayButtonProps } from "@daypicker/react";

type DatePickerProps = {
  selectedDay: Date | undefined;
  setSelectedDay: (date: Date) => void;
  bookedDates: Date[];
  onMonthChange: (month: Date) => void;
};

export const DatePicker: FC<DatePickerProps> = ({
  selectedDay,
  setSelectedDay,
  bookedDates,
  onMonthChange,
}) => {

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hasNavigated, setHasNavigated] = useState(false);

  const displayedMonth =
    selectedDay && !hasNavigated ? selectedDay : currentMonth;


  const today = new Date();
  const firstAllowedMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  const previousMonth = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth() - 1,
    1
  );
  const isPreviousMonthDisabled = previousMonth < firstAllowedMonth;


  useEffect(() => {
    if (
      selectedDay &&
      !hasNavigated &&
      (selectedDay.getFullYear() !== currentMonth.getFullYear() ||
        selectedDay.getMonth() !== currentMonth.getMonth())
    ) {
      onMonthChange(
        new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1)
      );
    }
  }, [currentMonth, hasNavigated, onMonthChange, selectedDay]);

  const goToPreviousMonth = () => {
    if (isPreviousMonthDisabled) return;

    setHasNavigated(true);
    setCurrentMonth(previousMonth);
    onMonthChange(previousMonth);
  };

  const goToNextMonth = () => {
    const month = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + 1,
      1
    );
    setHasNavigated(true);
    setCurrentMonth(month);
    onMonthChange(month);
  };

  const monthYear = displayedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const CustomDayButton = (props: DayButtonProps) => {
    const isBooked = props.modifiers.booked;
    if (isBooked) {
      return (
        <DayButton
          {...props}
          className="min-h-[44px] w-full relative flex flex-col items-center justify-center rounded-lg bg-zinc-900/40 text-zinc-500 cursor-not-allowed border border-zinc-800/40"
        >
          <span className="text-xs line-through">
            {props.day.date.getDate()}
          </span>

          <span className="text-[10px] font-bold text-rose-400 absolute top-0.5 right-1">
            ✕
          </span>
        </DayButton>
      );
    }
    return <DayButton {...props} />;
  };

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
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-white enabled:hover:bg-zinc-800 transition-colors disabled:opacity-30"
            type="button"
            onClick={goToPreviousMonth}
            disabled={isPreviousMonthDisabled}
          >
            ‹
          </button>
          <span className="text-base font-semibold text-white tracking-wide">
            {monthYear}
          </span>
          <button
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-zinc-400 enabled:hover:text-white enabled:hover:bg-zinc-800 transition-colors"
            type="button"
            onClick={goToNextMonth}
          >
            ›
          </button>
        </div>

        <DayPicker
          mode="single"
          month={displayedMonth}
          onMonthChange={(month) => {
            setHasNavigated(true);
            setCurrentMonth(month);
            onMonthChange(month);
          }}
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
            { dayOfWeek: [0] },
            ...bookedDates,
          ]}

          // Seven equal columns that always fit the card (no fixed day widths,
          // which pushed Sat/Sun off-screen on phones). Taps stay >= 44px tall.
          classNames={{
            month_caption: "hidden",
            button_previous: "hidden",
            button_next: "hidden",

            months: "w-full max-w-none",
            month: "w-full",
            month_grid: "w-full table-fixed border-collapse",
            weekday: "pb-2 text-center text-xs font-medium text-zinc-400",
            day: "p-0.5 text-center",
            outside: "text-zinc-600",
            today: "text-white font-bold [&>button]:bg-zinc-800 [&>button]:rounded-lg",
            selected:
              "font-bold text-white [&>button]:!bg-wine [&>button]:rounded-lg [&>button]:shadow-md [&>button]:ring-2 [&>button]:ring-wine-light/60",
            day_button:
              "w-full min-h-[44px] rounded-lg text-sm flex items-center justify-center aria-disabled:line-through",
          }}
          components={{
            DayButton: CustomDayButton,
          }}
        />

      </div>
    </section>
  );
};