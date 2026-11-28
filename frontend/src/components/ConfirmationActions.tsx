import { iconProps } from "./lineIconProps";

type ConfirmationActionsProps = {
  onExit: () => void;
  onEdit: () => void;
  onShare: () => void;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wine-light";
const mainButton = `w-full min-h-[48px] rounded-xl px-7 flex items-center justify-center gap-2 font-bold uppercase text-white cursor-pointer transition-colors ${focusRing}`;
const ghost = `flex-1 basis-36 min-h-11 rounded-xl px-4 flex items-center justify-center gap-2 text-sm font-medium border border-card-border bg-card-bg hover:bg-zinc-800 text-zinc-200 cursor-pointer transition-colors ${focusRing}`;

export function ConfirmationActions({
  onExit,
  onEdit,
  onShare,
}: ConfirmationActionsProps) {
  return (
    <footer className="flex flex-col gap-3 mt-6">
      <button
        type="button"
        onClick={onExit}
        className={`${mainButton} bg-wine hover:bg-wine-hover`}
      >
        Exit
      </button>
      <button
        type="button"
        onClick={onEdit}
        className={`${mainButton} border border-wine hover:bg-wine/20`}
      >
        Edit reservation
      </button>

      <div className="flex flex-wrap gap-3">
        <button type="button" className={ghost}>
          <svg className="w-[18px] h-[18px]" {...iconProps}>
            <rect x="3.5" y="5" width="17" height="15" rx="2" />
            <path d="M3.5 10h17M8 3v4M16 3v4M12 13v4M10 15h4" />
          </svg>
          Add to calendar
        </button>
        <button type="button" onClick={onShare} className={ghost}>
          <svg className="w-[18px] h-[18px]" {...iconProps}>
            <path d="M12 15V4M8 7.5L12 3.5l4 4" />
            <path d="M5 12v6.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V12" />
          </svg>
          Share
        </button>
      </div>
    </footer>
  );
}
