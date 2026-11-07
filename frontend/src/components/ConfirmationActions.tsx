type ConfirmationActionsProps = {
  onExit: () => void;
  onEdit: () => void;
  onShare: () => void;
};

export function ConfirmationActions({
  onExit,
  onEdit,
  onShare,
}: ConfirmationActionsProps) {
  return (
    <footer className="mt-6 flex flex-col gap-3 w-full pb-3">
      <button
        type="button"
        onClick={onExit}
        className="w-full py-3.5 px-6 rounded-xl bg-[#8B1E3F] hover:bg-[#9E2248] text-white font-semibold text-base"
      >
        Exit
      </button>

      <button
        type="button"
        onClick={onEdit}
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
          type="button"
          onClick={onShare}
          className="w-full py-2.5 px-3 rounded-xl bg-[#1A1B20] hover:bg-[#23252C] border border-[#2D3039] text-gray-200 text-xs font-medium"
        >
          Share Details
        </button>
      </div>
    </footer>
  );
}
