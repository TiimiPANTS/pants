import type { FC } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
    message,
    handleGuestChange,
    handleInputChange,
    handleSubmit,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        Loading reservation...
      </div>
    );
  }

  return (
    <div className="antialiased min-h-screen flex flex-col bg-dark-bg text-white font-sans selection:bg-wine selection:text-white">
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-36 flex flex-col">
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
        </form>
      </main>
    </div>
  );
};