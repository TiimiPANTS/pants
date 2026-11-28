import type { ReactNode } from "react";

export const Icon = ({ children, className = "h-5 w-5" }: { children: ReactNode; className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`${className} flex-none fill-none stroke-current`}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {children}
    </svg>
);

export const CalendarIcon = () => (
    <Icon>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
);
export const ChartIcon = () => (
    <Icon>
        <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />
    </Icon>
);
export const UsersIcon = () => (
    <Icon>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 010 7M18 14.5c2 .7 3.5 2.6 3.5 5.5" />
    </Icon>
);
export const AccountIcon = () => (
    <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </Icon>
);
export const LogoutIcon = () => (
    <Icon>
        <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />
    </Icon>
);
export const PlusIcon = () => (
    <Icon>
        <path d="M12 5v14M5 12h14" />
    </Icon>
);
export const SearchIcon = () => (
    <Icon>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16 16l4.5 4.5" />
    </Icon>
);
export const EditIcon = () => (
    <Icon className="h-4 w-4">
        <path d="M4 20h4L19 9l-4-4L4 16z" />
    </Icon>
);
export const CloseIcon = () => (
    <Icon className="h-4 w-4">
        <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
);
export const NoteIcon = () => (
    <Icon className="mt-0.5 h-4 w-4 text-[#ffb2bf]">
        <path d="M4 5h16v11H9l-5 4z" />
    </Icon>
);
export const ChevronDown = ({ className }: { className?: string }) => (
    <Icon className={className}>
        <path d="M5 9l7 7 7-7" />
    </Icon>
);
export const ChevronLeft = () => (
    <Icon>
        <path d="M15 5l-7 7 7 7" />
    </Icon>
);
export const ChevronRight = () => (
    <Icon>
        <path d="M9 5l7 7-7 7" />
    </Icon>
);
