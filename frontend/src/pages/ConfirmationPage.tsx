import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LePantsLogo from "../assets/LePantsLogo.svg";
import { ConfirmationActions } from "../components/ConfirmationActions";
import { Header } from "../components/Header";
import { iconProps } from "../components/lineIconProps";
import { reservationCard } from "../components/pageStyles";
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
  const copiedTimer = useRef<number | undefined>(undefined);
  const state = location.state as LocationState | null;
  const reservation = state?.reservation;

  // The form is submitted from the bottom of a long page: open the confirmation at the top.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Don't flip "Copied" back after the page has closed.
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  if (!reservation) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Reservation information not found.</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="bg-wine hover:bg-wine-hover px-5 py-3 rounded-xl font-semibold transition-colors"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const reservationNumber = String(reservation.reservationId);
  const reservationDate = parseEuropeanDate(reservation.datetime);
  const formattedDate = reservationDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const formattedTime = reservation.startTime.substring(0, 5);

  const guests = `${reservation.partySize} ${reservation.partySize === 1 ? "guest" : "guests"}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reservationNumber);
    } catch {
      return; // Clipboard blocked (permissions or insecure page): leave the button as it was
    }
    setCopied(true);
    // Restart the timer, so a second click shows "Copied" for the full two seconds.
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      return;
    }

    const shareText = [
      "Le Pants reservation",
      formattedDate,
      formattedTime,
      guests,
      `Reservation no. ${reservationNumber}`,
    ].join("\n");

    try {
      await navigator.share({ title: "Le Pants Reservation", text: shareText });
    } catch {
      // The guest closed the share sheet, or the browser blocked it: nothing to do.
    }
  };

  return (
    <div className="antialiased min-h-screen flex flex-col bg-dark-bg text-white font-sans selection:bg-wine selection:text-white">
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 pb-12 flex flex-col">
        <Header logoUrl={LePantsLogo} restaurantName="Le Pants" />

        <section className={reservationCard}>
          {/* Status */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-14 h-14 rounded-full border-2 border-wine bg-wine/20 flex items-center justify-center text-white shadow-lg mb-4">
              <svg className="w-7 h-7" {...iconProps} strokeWidth={2.4}>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h2 className="font-headline text-3xl font-normal italic text-white">
              Reservation confirmed
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              We’ve sent the details to
            </p>
            <div className="mt-3 inline-flex items-center gap-2 max-w-full px-4 py-2 rounded-full border border-zinc-700 bg-surface-input text-sm font-medium text-white break-all">
              <svg className="w-4 h-4 text-[#ffb2bf] shrink-0" {...iconProps}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3.5 6.5l8.5 6 8.5-6" />
              </svg>
              {reservation.customer.email}
            </div>
          </div>

          <ReservationDetailsCard
            reservationNumber={reservationNumber}
            customerName={`${reservation.customer.firstname} ${reservation.customer.lastname}`}
            formattedDate={formattedDate}
            formattedTime={formattedTime}
            partySize={reservation.partySize}
            details={reservation.details}
            copied={copied}
            onCopy={handleCopy}
          />
        </section>

        <ConfirmationActions
          onExit={() => navigate("/")}
          onEdit={() =>
            navigate(`/reserve/${reservation.editToken}`, { viewTransition: true })
          }
          onShare={handleShare}
        />
      </main>
    </div>
  );
}

export default ConfirmationPage;