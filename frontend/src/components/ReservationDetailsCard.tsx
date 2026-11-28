import type { ReactNode } from "react";
import { iconProps } from "./lineIconProps";

type ReservationDetailsCardProps = {
  reservationNumber: string;
  customerName: string;
  formattedDate: string;
  formattedTime: string;
  partySize: number;
  details: string;
  copied: boolean;
  onCopy: () => void;
};

const label =
  "block text-xs uppercase tracking-widest font-bold text-zinc-300";

function DetailRow({
  icon,
  title,
  value,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3.5 min-h-11 ${className}`}>
      <div className="w-11 h-11 rounded-full border border-zinc-700 bg-surface-input text-[#ffb2bf] flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" {...iconProps}>
          {icon}
        </svg>
      </div>
      <div>
        <p className={label}>{title}</p>
        <p className="mt-0.5 text-lg font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

export function ReservationDetailsCard({
  reservationNumber,
  customerName,
  formattedDate,
  formattedTime,
  partySize,
  details,
  copied,
  onCopy,
}: ReservationDetailsCardProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        <DetailRow
          className="basis-full"
          title="Date"
          value={formattedDate}
          icon={
            <>
              <rect x="3.5" y="5" width="17" height="15" rx="2" />
              <path d="M3.5 10h17M8 3v4M16 3v4" />
            </>
          }
        />
        <DetailRow
          className="flex-1 basis-36"
          title="Time"
          value={formattedTime}
          icon={
            <>
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5V12l3 2" />
            </>
          }
        />
        <DetailRow
          className="flex-1 basis-36"
          title="Party"
          value={`${partySize} ${partySize === 1 ? "guest" : "guests"}`}
          icon={
            <>
              <circle cx="9" cy="8.5" r="3.5" />
              <path d="M2.5 19.5c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
              <path d="M15.5 5.2a3.5 3.5 0 010 6.6M18 14.4c1.9.8 3.1 2.6 3.5 5.1" />
            </>
          }
        />
      </div>

      <div className="h-px bg-zinc-800/80" />

      <div>
        <p className={label}>Reserved for</p>
        <p className="mt-1 text-base font-semibold text-white break-words">
          {customerName}
        </p>
      </div>

      <div>
        <p className={`${label} mb-2`}>Special requests</p>
        <p className="px-3.5 py-3 rounded-lg border border-zinc-700 bg-surface-input text-[15px] leading-[22px] text-zinc-200 break-words">
          {details || "No special requests"}
        </p>
      </div>

      <div className="flex gap-2.5 items-start px-3.5 py-3 rounded-lg border border-wine/40 bg-wine/10 text-sm leading-5 text-zinc-300">
        <svg
          className="w-[18px] h-[18px] mt-px text-[#ffb2bf] shrink-0"
          {...iconProps}
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
        <span>Free cancellation up to 1 hour before your reservation.</span>
      </div>

      <div className="h-px bg-zinc-800/80" />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={label}>Reservation no.</p>
          <p className="mt-1 text-lg font-semibold text-white tabular-nums tracking-[0.5px]">
            {reservationNumber}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          aria-label="Copy reservation number"
          className="min-h-11 px-4 rounded-lg border border-zinc-700 bg-surface-input hover:bg-zinc-800 text-zinc-200 flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-light"
        >
          {copied ? (
            <svg className="w-4 h-4 text-[#ffb2bf]" {...iconProps}>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4" {...iconProps}>
              <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
              <path d="M15.5 8.5V6a1.5 1.5 0 00-1.5-1.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5" />
            </svg>
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
