import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
    AccountIcon,
    CalendarIcon,
    ChartIcon,
    ChevronLeft,
    ChevronRight,
    LogoutIcon,
    PlusIcon,
    UsersIcon,
} from "./icons";
import LePantsLogo from "../assets/LePantsLogo.svg";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export const focusRing =
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white";
export const btn = `inline-flex min-h-11 items-center justify-center gap-2 rounded border border-zinc-700 px-3.5 text-base font-medium text-zinc-200 transition hover:bg-card-bg ${focusRing}`;
export const iconBtn = `flex h-11 w-11 flex-none items-center justify-center rounded border border-zinc-700 text-zinc-200 transition hover:bg-card-bg ${focusRing}`;
// Faint warm wine glow at the top of the staff pages (and sidebar), so they
// feel like the same place as the login. Kept very low so data stays easy to read.
const pageGlow = {
    backgroundImage:
        "radial-gradient(ellipse 70% 420px at 60% -120px, rgba(155, 27, 68, 0.2), transparent 70%)",
    backgroundRepeat: "no-repeat",
};
const railGlow = {
    backgroundImage:
        "radial-gradient(ellipse 160% 260px at 0% -60px, rgba(155, 27, 68, 0.18), transparent 70%)",
    backgroundRepeat: "no-repeat",
};

export const primaryBtn = `flex h-12 items-center justify-center gap-2 rounded-full border border-[#B52252] bg-[#9B1B44] px-5 text-base font-medium text-white transition hover:bg-wine-hover ${focusRing}`;

// Staff form fields: same label and input look as the login card.
export const fieldLabel = "mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-zinc-400";
export const fieldInput =
    "min-h-12 w-full rounded-lg border border-card-border bg-surface-input px-4 text-base text-white placeholder:text-zinc-500 outline-none transition focus:border-[#ffb2bf]/60 focus:ring-2 focus:ring-wine/30";
export const staffCard = "flex flex-col gap-5 rounded-lg border border-card-border bg-card-bg p-5 md:p-6";

type Section = "bookings" | "analytics" | "account";

const RAIL_KEY = "ownerShell.rail";

const ROLE_ADMIN = 1;
const ROLE_OWNER = 2;
const ROLE_EMPLOYEE = 3;

type Props = {
    active: Section;
    /** Mobile top bar contents (title + optional actions). */
    mobileHeader: ReactNode;
    /** Show the floating "New booking" pill on mobile. */
    showNewBookingFab?: boolean;
    children: ReactNode;
};

/** Staff layout: side rail on md+, top bar + bottom tabs on mobile. */
export const OwnerShell = ({ active, mobileHeader, showNewBookingFab = false, children }: Props) => {
    const navigate = useNavigate();
    const [role, setRole] = useState<number | null>(null);
    const [collapsed, setCollapsed] = useState(() => localStorage.getItem(RAIL_KEY) === "collapsed");

    const toggleRail = () =>
        setCollapsed((wasCollapsed) => {
            localStorage.setItem(RAIL_KEY, wasCollapsed ? "expanded" : "collapsed");
            return !wasCollapsed;
        });

    useEffect(() => {
        const loadRole = async () => {
            try {
                const res = await fetch(`${API_URL}/users/me`, { credentials: "include" });
                if (res.status === 401 || res.status === 403) {
                    navigate("/login");
                    return;
                }
                if (res.ok) setRole(Number((await res.json()).roleId));
            } catch {
                // Nav items that need a role simply stay hidden.
            }
        };
        loadRole();
    }, [navigate]);

    const handleLogout = async () => {
        await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
        navigate("/login");
    };

    const canSeeAnalytics = role === ROLE_ADMIN || role === ROLE_OWNER;
    const canManageUsers = role !== null && role !== ROLE_EMPLOYEE;

    const navItems = [
        { label: "Bookings", icon: <CalendarIcon />, to: "/dashboard", section: "bookings", show: true },
        { label: "Analytics", tabLabel: "Stats", icon: <ChartIcon />, to: "/analytics", section: "analytics", show: canSeeAnalytics },
        { label: "Users", icon: <UsersIcon />, to: "/owner/usermanagement", section: null, show: canManageUsers },
    ].filter((item) => item.show);

    const tabs = [
        ...navItems.map((item) => ({ ...item, label: item.tabLabel ?? item.label })),
        { label: "Account", icon: <AccountIcon />, to: "/edituser", section: "account" },
    ];

    const railLink = `flex min-h-10 items-center gap-3 rounded text-left text-base font-medium ${focusRing} ${
        collapsed ? "justify-center px-0" : "px-3"
    }`;
    /** Rail button; the current page gets white text and a wine bar on the left. */
    const railItem = (on: boolean) =>
        `relative ${railLink} ${
            on
                ? "bg-white/[.04] text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:bg-[#B52252]"
                : "text-zinc-300 hover:text-white"
        }`;
    const onAccount = active === "account";
    /** Collapsed rail shows icons only; keep the name for screen readers and as a hover tooltip. */
    const railLabel = (label: string) => (collapsed ? <span className="sr-only">{label}</span> : label);

    return (
        <div className="min-h-screen bg-[#0A0A0C] font-sans text-zinc-200 md:flex" style={pageGlow}>
            <a
                href="#main"
                className="absolute -left-[9999px] top-2 z-20 rounded bg-white px-4 py-3 text-[17px] font-semibold text-black focus:left-2"
            >
                Skip to main content
            </a>

            {/* Side rail (md+) */}
            <aside
                aria-label="Sidebar"
                style={railGlow}
                className={`sticky top-0 hidden h-screen flex-none flex-col gap-5 border-r border-card-border bg-dark-bg py-5 md:flex ${
                    collapsed ? "w-16 px-2" : "w-52 px-3"
                }`}
            >
                <div
                    className={`flex items-center ${collapsed ? "flex-col gap-3" : "justify-between gap-2 pl-1"}`}
                >
                    <div className="flex min-w-0 items-center gap-2.5">
                        <img
                            src={LePantsLogo}
                            alt={collapsed ? "Le Pants" : ""}
                            className="h-10 w-10 flex-none rounded-full border border-card-border bg-card-bg object-cover p-0.5"
                        />
                        {!collapsed && (
                            <div className="min-w-0">
                                <div className="truncate font-headline text-xl font-normal italic leading-7 text-white">
                                    Le Pants
                                </div>
                                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                                    Staff
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={toggleRail}
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        aria-expanded={!collapsed}
                        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                        className={`flex h-10 w-10 flex-none items-center justify-center rounded text-zinc-300 hover:bg-card-bg hover:text-white ${focusRing}`}
                    >
                        {collapsed ? <ChevronRight /> : <ChevronLeft />}
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => navigate("/reserve")}
                    title={collapsed ? "New booking" : undefined}
                    className={`${primaryBtn} h-10 text-[15px] ${collapsed ? "px-0" : "px-4"}`}
                >
                    <PlusIcon />
                    {railLabel("New booking")}
                </button>
                <nav aria-label="Main" className="flex flex-col gap-1">
                    {navItems.map((item) => {
                        const on = item.section === active;
                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => navigate(item.to)}
                                aria-current={on ? "page" : undefined}
                                title={collapsed ? item.label : undefined}
                                className={railItem(on)}
                            >
                                {item.icon}
                                {railLabel(item.label)}
                            </button>
                        );
                    })}
                </nav>
                <div className="mt-auto flex flex-col gap-1 border-t border-card-border pt-3">
                    <button
                        type="button"
                        onClick={() => navigate("/edituser")}
                        aria-current={onAccount ? "page" : undefined}
                        title={collapsed ? "My account" : undefined}
                        className={railItem(onAccount)}
                    >
                        <AccountIcon />
                        {railLabel("My account")}
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        title={collapsed ? "Log out" : undefined}
                        className={`${railLink} text-zinc-300 hover:text-white`}
                    >
                        <LogoutIcon />
                        {railLabel("Log out")}
                    </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-[72px] items-center justify-between border-b border-zinc-700/40 px-5 md:hidden">
                    {mobileHeader}
                </header>

                <main
                    id="main"
                    tabIndex={-1}
                    className={`flex flex-1 flex-col gap-5 px-5 pt-5 md:gap-6 md:px-10 md:pb-10 md:pt-8 ${
                        showNewBookingFab ? "pb-40" : "pb-28"
                    }`}
                >
                    {children}
                </main>
            </div>

            {/* Mobile floating action + bottom tabs */}
            <div className="fixed inset-x-0 bottom-0 z-10 md:hidden">
                {showNewBookingFab && (
                    <div className="flex justify-end px-4 pb-3.5">
                        <button
                            type="button"
                            onClick={() => navigate("/reserve")}
                            className={`${primaryBtn} shadow-[0_8px_30px_-4px_rgba(155,27,68,.35)]`}
                        >
                            <PlusIcon />
                            New booking
                        </button>
                    </div>
                )}
                <nav aria-label="Main" className="flex border-t border-zinc-700/40 bg-[#0A0A0C]/90 pb-1.5 backdrop-blur">
                    {tabs.map((tab) => {
                        const on = tab.section === active;
                        return (
                            <button
                                key={tab.label}
                                type="button"
                                onClick={() => navigate(tab.to)}
                                aria-current={on ? "page" : undefined}
                                className={`relative flex min-h-15 flex-1 flex-col items-center justify-center gap-1 text-sm font-semibold ${focusRing} ${
                                    on
                                        ? "text-white before:absolute before:inset-x-[30%] before:top-0 before:h-[3px] before:bg-[#B52252]"
                                        : "text-zinc-300"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};
