import type { FC } from "react";
import { getAvailableTimes, type ReservationTime } from "../types/reservation";


type TimeSlotSelectorProps = {
  selectedDay: Date | undefined;
  selectedTime: ReservationTime | undefined;
  setSelectedTime: (time: ReservationTime) => void;
  guestCount: number;
  slotAvailableCapacities: Map<ReservationTime, number>;
  currentReservationTime?: ReservationTime;
  isAvailabilityLoading: boolean;
  availabilityError: string | null;
};

// Only mention seat counts when they are actually running low.
const FEW_SEATS = 10;

export const TimeSlotSelector: FC<TimeSlotSelectorProps> = ({
  selectedDay,
  selectedTime,
  setSelectedTime,
  guestCount,
  slotAvailableCapacities,
  currentReservationTime,
  isAvailabilityLoading,
  availabilityError,
}) => {
  const now = new Date();
  const availableTimes = getAvailableTimes(selectedDay);
  const showSeats = Boolean(selectedDay) && !isAvailabilityLoading && !availabilityError;

  const selectedSeatsLeft = selectedTime
    ? slotAvailableCapacities.get(selectedTime) ?? 0
    : null;

  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest font-bold text-zinc-300 flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-wine" />
        3. Select Time
      </h2>

      <div className="grid grid-cols-3 gap-2.5">
        {availableTimes.map((time) => {
        
          const [hours, minutes] = time.split(":").map(Number);

          const selectedDateTime = selectedDay
          ? new Date(
            selectedDay.getFullYear(),
            selectedDay.getMonth(),
            selectedDay.getDate(),
            hours,
            minutes
          )
          : null ;

          const remainingCapacity = slotAvailableCapacities.get(time) ?? 0;
          const isReserved =
            remainingCapacity < guestCount && time !== currentReservationTime;
          const isDisabled =
            isAvailabilityLoading ||
            Boolean(availabilityError) ||
            isReserved ||
            (selectedDateTime ? selectedDateTime <= now : false);
          
          const isSelected = time === selectedTime;

          return (
            <button
              key={time}
              disabled={isDisabled}
              aria-label={`${time}, capacity for ${remainingCapacity} guests`}
              title={`${remainingCapacity} guests can be seated at this time`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedTime(time)}
              className={
                isReserved
                  ? "min-h-[44px] py-2.5 px-3 border border-zinc-800 bg-zinc-900/20 rounded-lg text-sm text-zinc-600 line-through cursor-not-allowed"
                  : isDisabled
                  ? "min-h-[44px] py-2.5 px-3 border border-zinc-800 bg-zinc-900/20 rounded-lg text-sm text-zinc-600 line-through"
                  : isSelected
                  ? "min-h-[44px] py-2.5 px-3 border-2 border-wine bg-wine rounded-lg text-sm font-bold text-white"
                  : "min-h-[44px] py-2.5 px-3 border border-zinc-700 bg-zinc-900/60 rounded-lg text-sm font-semibold text-zinc-200"
              }
            >
              {time}
              {showSeats && !isDisabled && remainingCapacity <= FEW_SEATS && (
                <span
                  className={`block text-[10px] font-medium uppercase tracking-wider ${
                    isSelected ? "text-white/80" : "text-[#ffb2bf]"
                  }`}
                >
                  Few left
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showSeats && selectedTime && selectedSeatsLeft !== null && (
        <div className="mt-3 text-sm" role="status" aria-live="polite">
          {selectedSeatsLeft < guestCount && selectedTime !== currentReservationTime ? (
            <p className="text-red-400">
              Not enough seats for a party of {guestCount} at this time.
            </p>
          ) : (
            <p className="text-zinc-300">
              <span className="font-semibold text-white">
                {selectedSeatsLeft} {selectedSeatsLeft === 1 ? "seat" : "seats"} free
              </span>{" "}
              at {selectedTime} · add your details below
            </p>
          )}
        </div>
      )}
      {isAvailabilityLoading && (
        <p className="mt-2 text-xs text-zinc-400" role="status">
          Checking reservation availability...
        </p>
      )}
      {!isAvailabilityLoading &&
        !availabilityError &&
        availableTimes.length > 0 &&
        availableTimes.every(
          (time) => (slotAvailableCapacities.get(time) ?? 0) === 0
        ) && (
          <p className="mt-2 text-sm text-zinc-400" role="status">
            No capacity remains for this date. Please choose another date.
          </p>
        )}
    </section>
  );
};