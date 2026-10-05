import type { FC } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useReservation } from "../hooks/useReservation";

import { Header } from "../components/Header";
import { DatePicker } from "../components/DatePicker";
import { PartySizeSelector } from "../components/PartySizeSelector";
import { TimeSlotSelector } from "../components/TimeSlotSelector";
import { ContactDetails } from "../components/ContactDetails";

import LePantsLogo from "../assets/LePantsLogo.svg";

// Hardcoded for now, but this could easily be fetched
// from your Spring Boot backend later
const bookedDays = new Set([
  4,
  5,
  11,
  12,
  18,
  19,
  25,
  26,
]);

export const ReservationPage: FC = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  const {
    isEditMode,
    isLoading,
    selectedDay,
    setSelectedDay,
    selectedTime,
    setSelectedTime,
    guestCount,
    updateGuestCount,
    form,
    isSubmitting,
    error,
    validationErrors,
    message,
    handleGuestChange,
    handleInputChange,
    handleSubmit,
    isCancelling,
    isCancelled,
    handleCancel,
  } = useReservation(token);

  const submitReservation = async () => {
    const createdReservation = await handleSubmit();

    if (!createdReservation) {
      return;
    }

    navigate("/confirmation", {
      state: {
        reservation: createdReservation,
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
        <div className="mb-4 flex justify-end">
          <Link
            to="/login"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-card-border bg-card-bg px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-wine hover:bg-wine hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-light"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              login
            </span>
            Staff sign in
          </Link>
        </div>
        <Header
          logoUrl={LePantsLogo}
          restaurantName="Le Pants"
        />

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
              Edit your reservation
            </h2>
          )}

          <DatePicker
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            bookedDays={bookedDays}
          />

          <PartySizeSelector
            guestCount={guestCount}
            updateGuestCount={updateGuestCount}
            handleGuestChange={handleGuestChange}
          />

          <TimeSlotSelector
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
          />

          <ContactDetails
            form={form}
            validationErrors={validationErrors}
            handleInputChange={handleInputChange}
          />

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

            {isEditMode && (
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