import type { FC } from "react";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useReservation } from "../hooks/useReservation";

import { Header } from "../components/Header";
import { DatePicker } from "../components/DatePicker";
import { PartySizeSelector } from "../components/PartySizeSelector";
import { TimeSlotSelector } from "../components/TimeSlotSelector";
import { ContactDetails } from "../components/ContactDetails";
import { useAuth } from "../hooks/useAuth";

import LePantsLogo from "../assets/LePantsLogo.svg";
import { openingHours } from "../utils/openingHours";

// Same look as the home page's navbar Reserve pill.
const topPill =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ffb2bf]/70 px-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-[#ffb2bf] transition-colors hover:border-wine-light hover:bg-wine hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-light";

export const ReservationPage: FC = () => {
  const navigate = useNavigate();
  const { token, id } = useParams();
  const [availabilityMonth, setAvailabilityMonth] = useState(() => new Date());
  const { isAuthenticated } = useAuth();

  const {
    isEditMode,
    isStaffEdit,
    isLoading,
    selectedDay,
    selectDay,
    selectedTime,
    setSelectedTime,
    slotAvailableCapacities,
    currentReservationTime,
    bookedDates,
    isAvailabilityLoading,
    availabilityError,
    refreshAvailability,
    guestCount,
    updateGuestCount,
    form,
    isSubmitting,
    error,
    validationErrors,
    message,
    handleInputChange,
    handleSubmit,
    isCancelling,
    isCancelled,
    handleCancel,
  } = useReservation(token,id);

  // The rest of the form opens once a time is chosen (edit mode already has one).
  const showDetails = Boolean(selectedTime);
  const handleMonthChange = useCallback((month: Date) => {
    setAvailabilityMonth(month);
    void refreshAvailability(month);
  }, [refreshAvailability]);

  const submitReservation = async () => {
    const savedReservation = await handleSubmit();

    if (!savedReservation) {
      return;
    }

    if (isStaffEdit) {
      navigate("/dashboard");
      return;
    }

    navigate("/confirmation", {
      state: {
        reservation: savedReservation,
      },
    });
  };

  const cancelReservation = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this reservation?"
    );

    if (!confirmed) {
      return;
    }

    await handleCancel();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        Loading reservation...
      </div>
    );
  }

  if (isCancelled) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center px-4">
        <div className="bg-card-bg border border-card-border rounded-2xl p-7 text-center max-w-md w-full space-y-4">
          <h2 className="text-xl font-bold">Reservation cancelled</h2>
          <p className="text-zinc-300 text-sm">
            Your reservation has been cancelled. We hope to see you another time!
          </p>
          <button
            type="button"
            onClick={() => navigate("/reserve")}
            className="w-full min-h-[48px] px-7 bg-wine hover:bg-wine-hover text-white font-bold uppercase rounded-xl transition-colors"
          >
            Make a new reservation
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="antialiased min-h-screen flex flex-col bg-dark-bg text-white font-sans selection:bg-wine selection:text-white">
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-36 flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className={`group ${topPill}`}>
            <span
              className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5"
              aria-hidden="true"
            >
              arrow_back
            </span>
            Home
          </Link>

          {!isLoading && isAuthenticated && (
            <Link
              to="/dashboard"
              className={topPill}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                person_outline
              </span>
              Dashboard
            </Link>
          )}

        </div>
        <Header
          logoUrl={LePantsLogo}
          restaurantName="Le Pants"
        />

        {/* Opening hours: three even columns, today's label in pink */}
        <dl
          aria-label="Opening hours"
          className="-mt-2 mb-8 grid grid-cols-3 divide-x divide-card-border text-center"
        >
          {openingHours.map((row) => {
            const isToday = row.match.includes(new Date().getDay());
            return (
              <div key={row.days} className="px-2">
                <dt
                  className={`text-[11px] font-medium uppercase tracking-[0.18em] ${
                    isToday ? "text-[#ffb2bf]" : "text-zinc-400"
                  }`}
                >
                  {row.short}
                  {isToday && <span className="sr-only"> (today)</span>}
                </dt>
                <dd className="mt-1 text-sm tabular-nums text-zinc-200">
                  {row.time === "Closed" ? "Closed" : row.time.replace(/ /g, "")}
                </dd>
              </div>
            );
          })}
        </dl>

        <form
          id="reservationForm"
          className="bg-card-bg border border-card-border rounded-2xl p-5 sm:p-7 shadow-2xl space-y-7"
          onSubmit={(event) => {
            event.preventDefault();
            submitReservation();
          }}
        >
          {isEditMode && (
            <h2 className="text-lg font-bold text-white">
              {isStaffEdit ? `Edit reservation #${id}` : "Edit your reservation"}
            </h2>
          )}

          <DatePicker
            selectedDay={selectedDay}
            setSelectedDay={selectDay}
            bookedDates={bookedDates}
            onMonthChange={handleMonthChange}
          />

          <PartySizeSelector
            guestCount={guestCount}
            updateGuestCount={updateGuestCount}
          />

          <p className="text-sm text-zinc-400" role="note">
            You can book a table for any time up to{" "}
            <strong className="font-semibold text-white">17:00</strong>.
          </p>

          <TimeSlotSelector
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            guestCount={guestCount}
            slotAvailableCapacities={slotAvailableCapacities}
            currentReservationTime={currentReservationTime}
            isAvailabilityLoading={isAvailabilityLoading}
            availabilityError={availabilityError}
          />

          {availabilityError && (
            <div className="text-sm text-red-400" role="alert">
              <p>Could not check reservation availability: {availabilityError}</p>
              <button
                type="button"
                onClick={() => void refreshAvailability(availabilityMonth)}
                className="mt-2 underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Outside the reveal below, so load and cancel errors show before a time is picked */}
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="text-green-400 text-sm" role="status">
              {message}
            </p>
          )}

          {/* Step 2: contact details and confirm appear only once a time is picked */}
          {!showDetails && (
            <p className="text-center text-sm text-zinc-400" role="status">
              Pick a time above to add your details.
            </p>
          )}

          <div
            className={`reveal${showDetails ? " is-open" : ""}`}
            aria-hidden={!showDetails}
            inert={!showDetails}
          >
            <div className="space-y-7">
              <ContactDetails
                form={form}
                validationErrors={validationErrors}
                handleInputChange={handleInputChange}
              />

              <button
                type="submit"
                disabled={isSubmitting || isAvailabilityLoading || Boolean(availabilityError)}
                className="w-full min-h-[48px] px-7 bg-wine hover:bg-wine-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase rounded-xl transition-colors"
              >
                {isSubmitting
                  ? isEditMode
                    ? "Updating reservation..."
                    : "Creating reservation..."
                  : isEditMode
                    ? "Update Reservation"
                    : "Confirm Reservation"}
              </button>
            </div>
          </div>

          {isEditMode && !isStaffEdit &&(
            <button
              type="button"
              onClick={cancelReservation}
              disabled={isCancelling || isSubmitting}
              className="w-full min-h-[48px] px-7 border border-wine text-white font-bold uppercase rounded-xl hover:bg-wine/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCancelling ? "Cancelling..." : "Cancel Reservation"}
            </button>
          )}
        </form>
      </main>
    </div>
  );
};