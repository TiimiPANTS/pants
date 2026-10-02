import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LePantsLogo from "../assets/LePantsLogo.svg";

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
          <p className="mb-4">
            Reservation information not found.
          </p>

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

  const bookingReference =
    `#PV-${reservation.reservationId}`;

  const reservationDate = new Date(
    reservation.datetime
  );

  const formattedDate =
    reservationDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formattedTime =
    reservation.startTime.substring(0, 5);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      bookingReference
    );

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

        {/* Reservation card */}

        <main className="w-full flex-1">

          <div className="bg-[#1A1B20] rounded-2xl border border-[#2D3039] p-5 shadow-xl">

            <div className="flex items-center justify-between border-b border-[#2D3039] pb-4 mb-4">

              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold block">
                  Booking Reference
                </span>

                <span className="text-lg font-mono font-bold text-white">
                  {bookingReference}
                </span>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-[#21232B] hover:bg-[#282a33] border border-[#373A44] rounded-lg"
              >
                {copied ? "Copied!" : "Copy"}
              </button>

            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-3 mb-4 text-sm">

              <div>
                <span className="text-xs text-gray-400 block">
                  Restaurant
                </span>

                <span className="text-white font-serif font-bold text-base">
                  Le Pants
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block">
                  Reserved by
                </span>

                <span className="text-white font-medium">
                  {reservation.customer.firstname}{" "}
                  {reservation.customer.lastname}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block">
                  Date
                </span>

                <span className="text-white font-medium">
                  {formattedDate}
                </span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block">
                  Time & Party
                </span>

                <div className="flex items-center gap-2 mt-0.5">

                  <span className="text-white font-semibold">
                    {formattedTime}
                  </span>

                  <span className="text-xs bg-[#8B1E3F] text-white px-2 py-0.5 rounded font-medium">
                    {reservation.partySize}{" "}
                    {reservation.partySize === 1
                      ? "Guest"
                      : "Guests"}
                  </span>

                </div>
              </div>

            </div>

            <div className="border-t border-[#2D3039] pt-3.5 pb-3">

              <span className="text-xs text-gray-400 block font-medium mb-1">
                Special Requests
              </span>

              <div className="bg-[#21232B] rounded-lg p-2.5 border border-[#2D3039] text-xs text-gray-300 italic">

                {reservation.details
                  ? reservation.details
                  : "No special requests"}

              </div>

            </div>

            <div className="bg-[#141519] rounded-lg p-3 border border-[#262830] text-xs text-gray-400">

              <strong className="text-gray-300 font-medium">
                Cancellation policy:
              </strong>{" "}

              Free cancellation up to 1 hours before your reservation.

            </div>

          </div>

        </main>

        {/* Buttons */}

        <footer className="mt-6 flex flex-col gap-3 w-full pb-3">

          <button
            onClick={() => navigate("/")}
            className="w-full py-3.5 px-6 rounded-xl bg-[#8B1E3F] hover:bg-[#9E2248] text-white font-semibold text-base"
          >
            Exit
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/reserve/${reservation.editToken}`)
            }
            className="w-full py-3 px-6 rounded-xl bg-[#1A1B20] hover:bg-[#23252C] border border-[#8B1E3F] text-white font-semibold text-sm"
          >
            Edit Reservation
          </button>

          <div className="grid grid-cols-2 gap-3">

            <button
              type="button"
              className="w-full py-2.5 px-3 rounded-xl bg-[#1A1B20] hover:bg-[#23252C] border border-[#2D3039] text-gray-200 text-xs font-medium"
            >
              Add to Calendar
            </button>

            <button
              onClick={handleShare}
              type="button"
              className="w-full py-2.5 px-3 rounded-xl bg-[#1A1B20] hover:bg-[#23252C] border border-[#2D3039] text-gray-200 text-xs font-medium"
            >
              Share Details
            </button>

          </div>

        </footer>

      </div>
    </div>
  );
}

export default ConfirmationPage;