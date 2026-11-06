import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LePantsLogo from "../assets/LePantsLogo.svg";
import { ConfirmationActions } from "../components/ConfirmationActions";
import { ReservationDetailsCard } from "../components/ReservationDetailsCard";
import { parseEuropeanDate } from "../types/reservation";

type Customer = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
};

type Reservation = {
  reservationId: number;
  editToken: string;
  customer: Customer;
  startTime: string;
  endTime: string;
  datetime: string;
  partySize: number;
  details: string;
};

type LocationState = {
  reservation: Reservation;
};

function ConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const state = location.state as LocationState | null;
  const reservation = state?.reservation;

  if (!reservation) {
    return (
      <div className="min-h-screen bg-[#121316] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Reservation information not found.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#8B1E3F] px-5 py-3 rounded-xl font-semibold"
          >
            Back to reservation
          </button>
        </div>
      </div>
    );
  }

  const bookingReference = `#PV-${reservation.reservationId}`;
  const reservationDate = parseEuropeanDate(reservation.datetime);
  const formattedDate = reservationDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedTime = reservation.startTime.substring(0, 5);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingReference);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleShare = async () => {
    const shareText = `
Le Pants reservation
${formattedDate}
${formattedTime}
${reservation.partySize} guests
Reference: ${bookingReference}
    `;

    if (navigator.share) {
      await navigator.share({
        title: "Le Pants Reservation",
        text: shareText,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#121316] text-gray-100 flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col relative px-5 py-6 sm:py-8">
        {/* Exit button */}
        <div className="w-full flex items-center justify-end mb-2">
          <button
            aria-label="Exit"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-[#1A1B20]"
            type="button"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Header */}
        <header className="flex flex-col items-center text-center mt-1 mb-6">
          <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-lg border border-[#2D3039] p-0.5 bg-[#1A1B20]">
            <img
              alt="Le Pants logo"
              className="w-full h-full object-cover rounded-full"
              src={LePantsLogo}
            />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-tight mt-3">
            Le Pants
          </h1>
          <div className="w-10 h-0.5 bg-[#8B1E3F] rounded-full mt-2" />
        </header>

        {/* Confirmation */}
        <section className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-[#8B1E3F]/20 border-2 border-[#8B1E3F] flex items-center justify-center mb-3 shadow-lg">
            <svg
              className="w-7 h-7 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            Reservation Confirmed!
          </h2>
          <p className="text-gray-300 text-sm">
            Here’s your reservation sent to your email.
          </p>
          <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1B20] border border-[#2D3039] text-xs">
            <svg
              className="w-4 h-4 text-[#8B1E3F]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-medium text-white">
              {reservation.customer.email}
            </span>
          </div>
        </section>

        <main className="w-full flex-1">
          <ReservationDetailsCard
            bookingReference={bookingReference}
            customerName={`${reservation.customer.firstname} ${reservation.customer.lastname}`}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            partySize={reservation.partySize}
            details={reservation.details}
            copied={copied}
            onCopy={handleCopy}
          />
        </main>
        <ConfirmationActions
          onExit={() => navigate("/")}
          onEdit={() => navigate(`/reserve/${reservation.editToken}`)}
          onShare={handleShare}
        />
      </div>
    </div>
  );
}

export default ConfirmationPage;