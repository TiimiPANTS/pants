type ReservationDetailsCardProps = {
  bookingReference: string;
  customerName: string;
  formattedDate: string;
  formattedTime: string;
  partySize: number;
  details: string;
  copied: boolean;
  onCopy: () => void;
};

export function ReservationDetailsCard({
  bookingReference,
  customerName,
  formattedDate,
  formattedTime,
  partySize,
  details,
  copied,
  onCopy,
}: ReservationDetailsCardProps) {
  return (
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
          type="button"
          onClick={onCopy}
          className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-[#21232B] hover:bg-[#282a33] border border-[#373A44] rounded-lg"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-y-4 gap-x-3 mb-4 text-sm">
        <div>
          <span className="text-xs text-gray-400 block">Restaurant</span>
          <span className="text-white font-serif font-bold text-base">
            Le Pants
          </span>
        </div>

        <div>
          <span className="text-xs text-gray-400 block">Reserved by</span>
          <span className="text-white font-medium">{customerName}</span>
        </div>

        <div>
          <span className="text-xs text-gray-400 block">Date</span>
          <span className="text-white font-medium">{formattedDate}</span>
        </div>

        <div>
          <span className="text-xs text-gray-400 block">Time & Party</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-white font-semibold">{formattedTime}</span>
            <span className="text-xs bg-[#8B1E3F] text-white px-2 py-0.5 rounded font-medium">
              {partySize} {partySize === 1 ? "Guest" : "Guests"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2D3039] pt-3.5 pb-3">
        <span className="text-xs text-gray-400 block font-medium mb-1">
          Special Requests
        </span>
        <div className="bg-[#21232B] rounded-lg p-2.5 border border-[#2D3039] text-xs text-gray-300 italic">
          {details || "No special requests"}
        </div>
      </div>

      <div className="bg-[#141519] rounded-lg p-3 border border-[#262830] text-xs text-gray-400">
        <strong className="text-gray-300 font-medium">
          Cancellation policy:
        </strong>{" "}
        Free cancellation up to 1 hours before your reservation.
      </div>
    </div>
  );
}
