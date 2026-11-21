import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FloorPlan, type FloorReservation, type FloorTable } from "../components/FloorPlan";
import { btn, focusRing, iconBtn, OwnerShell } from "../components/OwnerShell";
import {
    ChevronLeft,
    ChevronRight,
    CloseIcon,
    EditIcon,
    Icon,
    NoteIcon,
    SearchIcon,
} from "../components/icons";
import { formatDateKey, parseEuropeanDate } from "../types/reservation";
import { addDays, currentTimeKey, startOfWeek } from "../utils/date";

type Reservation = {
    reservationId: number;
    customer: {
        firstname: string;
        lastname: string;
        email: string;
    };
    startTime: string;
    endTime: string;
    datetime: string;
    partySize: number;
    details: string;
    status: { name: string } | null;
};

type Filter = "upcoming" | "all" | "cancelled";
type View = "list" | "floor";

type TableAssignment = { id: { reservationId: number; tableId: number } };

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const FILTERS = [
    ["upcoming", "Upcoming"],
    ["all", "All dates"],
    ["cancelled", "Cancelled"],
] as const;

const VIEWS = [
    ["list", "List"],
    ["floor", "Floor plan"],
] as const;

const segmentClass = (on: boolean) =>
    `min-h-11 flex-1 rounded-full px-4 text-base font-medium transition ${focusRing} ${
        on ? "bg-card-bg text-white shadow-[inset_0_0_0_1px_#3F3F46]" : "text-zinc-300 hover:text-white"
    }`;

const hhmm = (time: string | null | undefined) => (time ? time.slice(0, 5) : "—");

const isCancelled = (r: Reservation) => r.status?.name === "CANCELLED";

const guestName = (r: Reservation) => `${r.customer.firstname} ${r.customer.lastname}`;

const reservationDate = (r: Reservation) => (r.datetime ? parseEuropeanDate(r.datetime) : null);

const reservationDateKey = (r: Reservation) => {
    const date = reservationDate(r);
    return date ? formatDateKey(date) : "";
};

const formatListDate = (r: Reservation) =>
    reservationDate(r)?.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) ?? "";

const sortByTime = (a: Reservation, b: Reservation) =>
    reservationDateKey(a).localeCompare(reservationDateKey(b)) ||
    (a.startTime ?? "").localeCompare(b.startTime ?? "");

/** GET a list endpoint; these return 404 when empty, which we treat as []. */
const fetchList = async <T,>(path: string): Promise<T[]> => {
    const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
    if (res.status === 404) return [];
    if (!res.ok) throw new Error(`Unable to load ${path}`);
    return (await res.json()) as T[];
};

const ListIcon = () => (
    <Icon className="h-[18px] w-[18px]">
        <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </Icon>
);

const GridIcon = () => (
    <Icon className="h-[18px] w-[18px]">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </Icon>
);

const TableChips = ({ tables }: { tables: FloorTable[] | undefined }) => {
    if (!tables?.length) return <span className="text-sm text-zinc-400">Unassigned</span>;
    return (
        <ul
            aria-label={`Tables ${tables.map((t) => t.tableNumber).join(", ")}`}
            className="m-0 inline-flex list-none flex-wrap gap-1.5 p-0 align-middle"
        >
            {tables.map((t) => (
                <li
                    key={t.id}
                    className="inline-flex whitespace-nowrap rounded border border-[#9B1B44]/55 bg-card-bg/60 px-2 py-0.5 text-sm font-semibold text-[#ffb2bf]"
                >
                    T{t.tableNumber}
                </li>
            ))}
        </ul>
    );
};

type BookingActionsProps = {
    reservation: Reservation;
    onEdit: () => void;
    onCancel: () => void;
    buttonClassName?: string;
};

const BookingActions = ({ reservation, onEdit, onCancel, buttonClassName = "" }: BookingActionsProps) => {
    const description = `booking for ${guestName(reservation)} at ${hhmm(reservation.startTime)}`;
    return (
        <>
            <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit ${description}`}
                className={`${btn} ${buttonClassName}`}
            >
                <EditIcon />
                Edit
            </button>
            <button
                type="button"
                onClick={onCancel}
                aria-label={`Cancel ${description}`}
                className={`${btn} ${buttonClassName} text-[#ffb4ab]`}
            >
                <CloseIcon />
                Cancel
            </button>
        </>
    );
};

export const OwnerDashboardPage = () => {
    const navigate = useNavigate();

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [filter, setFilter] = useState<Filter>("upcoming");
    const [query, setQuery] = useState("");
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [view, setView] = useState<View>("list");
    const [tables, setTables] = useState<FloorTable[]>([]);
    const [assignments, setAssignments] = useState<TableAssignment[]>([]);
    const [floorError, setFloorError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch(`${API_URL}/reservations`, { credentials: "include" });
                if (response.status === 401 || response.status === 403) {
                    navigate("/login");
                    return;
                }
                if (!response.ok) throw new Error("Unable to load reservations.");
                setReservations((await response.json()) as Reservation[]);

                // Table data is secondary: a failure here shouldn't hide the bookings.
                try {
                    const [tableData, assignmentData] = await Promise.all([
                        fetchList<FloorTable>("/tables"),
                        fetchList<TableAssignment>("/tablelists"),
                    ]);
                    setTables(tableData);
                    setAssignments(assignmentData);
                } catch {
                    setFloorError("Unable to load tables.");
                }
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Unable to load reservations.");
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [navigate]);

    const selectedKey = formatDateKey(selectedDate);
    const isToday = selectedKey === formatDateKey(new Date());
    const weekStart = startOfWeek(selectedDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const tablesByReservation = useMemo(() => {
        const tableById = new Map(tables.map((t) => [t.id, t]));
        const map = new Map<number, FloorTable[]>();
        for (const { id } of assignments) {
            const table = tableById.get(id.tableId);
            if (!table) continue;
            map.set(id.reservationId, [...(map.get(id.reservationId) ?? []), table]);
        }
        for (const list of map.values()) list.sort((a, b) => a.tableNumber - b.tableNumber);
        return map;
    }, [tables, assignments]);

    const dayReservations = useMemo(
        () => reservations.filter((r) => reservationDateKey(r) === selectedKey).sort(sortByTime),
        [reservations, selectedKey],
    );

    const activeDayReservations = useMemo(() => dayReservations.filter((r) => !isCancelled(r)), [dayReservations]);

    const summary = useMemo(() => {
        const now = currentTimeKey();
        const next = activeDayReservations.find((r) => !isToday || hhmm(r.startTime) >= now);
        return {
            bookings: activeDayReservations.length,
            guests: activeDayReservations.reduce((sum, r) => sum + r.partySize, 0),
            next: next ? hhmm(next.startTime) : "—",
        };
    }, [activeDayReservations, isToday]);

    const visible = useMemo(() => {
        let list: Reservation[];
        if (filter === "upcoming") list = dayReservations;
        else if (filter === "cancelled") list = reservations.filter(isCancelled).sort(sortByTime);
        else list = [...reservations].sort(sortByTime);

        const q = query.trim().toLowerCase();
        if (!q) return list;
        return list.filter((r) => `${guestName(r)} ${r.customer.email}`.toLowerCase().includes(q));
    }, [filter, dayReservations, reservations, query]);

    const floorReservations: FloorReservation[] = useMemo(
        () =>
            activeDayReservations.map((r) => ({
                reservationId: r.reservationId,
                guestName: guestName(r),
                startTime: r.startTime,
                endTime: r.endTime,
                tableIds: (tablesByReservation.get(r.reservationId) ?? []).map((t) => t.id),
            })),
        [activeDayReservations, tablesByReservation],
    );

    const longDate = selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    const weekday = selectedDate.toLocaleDateString("en-GB", { weekday: "long" });
    // Compact on phones: the year only appears when it isn't the current year.
    const shortDate = selectedDate.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        ...(selectedDate.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
    });
    const showDateColumn = filter !== "upcoming";

    const goEdit = (r: Reservation) => navigate(`/owner/reservations/${r.reservationId}/edit`);
    const goCancel = (r: Reservation) => navigate(`/owner/reservations/${r.reservationId}/cancel`);

    const searchField = (
        <label className="flex h-12 w-full items-center gap-2.5 rounded border border-zinc-700 bg-dark-bg px-3.5 text-zinc-300 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-white md:w-90">
            <SearchIcon />
            <span className="sr-only">Search guest or email</span>
            <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guest or email"
                className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-400"
            />
        </label>
    );

    return (
        <OwnerShell
            active="bookings"
            showNewBookingFab
            mobileHeader={
                <>
                    <h1 className="text-[26px] font-semibold leading-8 text-white">Bookings</h1>
                    <button
                        type="button"
                        aria-label="Search guests by name or email"
                        aria-expanded={showMobileSearch}
                        onClick={() => setShowMobileSearch((v) => !v)}
                        className={iconBtn}
                    >
                        <SearchIcon />
                    </button>
                </>
            }
        >
            <header className="hidden items-end justify-between md:flex">
                <div>
                    <div className="text-sm font-semibold text-zinc-300">{weekday}</div>
                    <h1 className="text-4xl font-medium leading-11 text-white">{longDate}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="Previous day"
                        onClick={() => setSelectedDate((d) => addDays(d, -1))}
                        className={`${iconBtn} h-12 w-12`}
                    >
                        <ChevronLeft />
                    </button>
                    <button type="button" onClick={() => setSelectedDate(new Date())} className={`${btn} min-h-12`}>
                        Today
                    </button>
                    <button
                        type="button"
                        aria-label="Next day"
                        onClick={() => setSelectedDate((d) => addDays(d, 1))}
                        className={`${iconBtn} h-12 w-12`}
                    >
                        <ChevronRight />
                    </button>
                </div>
            </header>

            <nav
                aria-label="Bookings view"
                className="flex gap-1 rounded-full border border-card-border bg-dark-bg p-[3px] md:hidden"
            >
                {VIEWS.map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        aria-pressed={view === value}
                        onClick={() => setView(value)}
                        className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full text-base font-medium ${focusRing} ${
                            view === value ? "bg-card-bg text-white shadow-[inset_0_0_0_1px_#B52252]" : "text-zinc-300"
                        }`}
                    >
                        {value === "list" ? <ListIcon /> : <GridIcon />}
                        {label}
                    </button>
                ))}
            </nav>

            {showMobileSearch && view === "list" && <div className="md:hidden">{searchField}</div>}

            <nav aria-label="Choose day" className="flex flex-col gap-2.5 md:hidden">
                <div className="flex items-center justify-between">
                    <h2 aria-live="polite" className="text-[17px] font-semibold text-white">
                        {shortDate}{" "}
                        <span className="font-normal text-zinc-300">
                            · week {weekDays[0].getDate()}–{weekDays[6].getDate()}
                        </span>
                    </h2>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            aria-label="Previous week"
                            onClick={() => setSelectedDate((d) => addDays(d, -7))}
                            className={iconBtn}
                        >
                            <ChevronLeft />
                        </button>
                        <button
                            type="button"
                            aria-label="Next week"
                            onClick={() => setSelectedDate((d) => addDays(d, 7))}
                            className={iconBtn}
                        >
                            <ChevronRight />
                        </button>
                    </div>
                </div>
                <ul className="m-0 flex list-none gap-1.5 p-0">
                    {weekDays.map((day) => {
                        const dayKey = formatDateKey(day);
                        const on = dayKey === selectedKey;
                        return (
                            <li key={dayKey} className="flex flex-1">
                                <button
                                    type="button"
                                    onClick={() => setSelectedDate(day)}
                                    aria-label={`${day.toLocaleDateString("en-GB", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                    })}${on ? ", selected" : ""}`}
                                    aria-current={on ? "date" : undefined}
                                    className={`flex min-h-[58px] flex-1 flex-col items-center justify-center rounded-lg border text-sm font-medium ${focusRing} ${
                                        on ? "border-[#B52252] bg-[#9B1B44] text-white" : "border-zinc-700 text-zinc-200"
                                    }`}
                                >
                                    <span>{day.toLocaleDateString("en-GB", { weekday: "short" })}</span>
                                    <b className="text-lg font-semibold">{day.getDate()}</b>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div
                role="group"
                aria-label={`Summary for ${weekday} ${longDate}`}
                className="grid grid-cols-3 divide-x divide-card-border rounded-lg border border-card-border bg-dark-bg"
            >
                {[
                    ["Bookings", summary.bookings],
                    ["Guests", summary.guests],
                    ["Next arrival", summary.next],
                ].map(([label, value]) => (
                    <div key={label} className="px-3.5 py-3 md:px-5 md:py-4">
                        <div className="text-sm font-semibold text-zinc-300">{label}</div>
                        <div className="text-2xl font-semibold text-white md:text-[28px] md:font-medium">{value}</div>
                    </div>
                ))}
            </div>

            {/* On mobile the list and floor plan are separate views; desktop shows both,
                floor plan first and the bookings table underneath. */}
            <div className={`flex-col gap-5 md:order-last md:flex md:gap-6 ${view === "list" ? "flex" : "hidden"}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div
                        role="group"
                        aria-label="Filter bookings"
                        className="flex w-full gap-1 rounded-full border border-card-border bg-dark-bg p-1 md:w-auto"
                    >
                        {FILTERS.map(([value, label]) => (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={filter === value}
                                onClick={() => setFilter(value)}
                                className={segmentClass(filter === value)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <div className="hidden md:block">{searchField}</div>
                </div>

                {isLoading && <p className="text-sm text-zinc-400">Loading reservations...</p>}
                {error && <p className="text-sm text-[#ffb4ab]">{error}</p>}

                {!isLoading && !error && visible.length === 0 && (
                    <p className="rounded-lg border border-card-border bg-card-bg p-8 text-center text-sm text-zinc-400">
                        {filter === "upcoming" ? `No bookings on ${shortDate}.` : "No reservations found."}
                    </p>
                )}

                {!isLoading && !error && visible.length > 0 && (
                    <>
                        <section aria-label="Bookings" className="flex flex-col gap-3 md:hidden">
                            {visible.map((r) => {
                                const cancelled = isCancelled(r);
                                const textColor = cancelled ? "text-zinc-300" : "text-white";
                                return (
                                    <article
                                        key={r.reservationId}
                                        className={`grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3 rounded-lg border bg-card-bg p-4 ${
                                            cancelled ? "border-dashed border-zinc-700" : "border-card-border"
                                        }`}
                                    >
                                        <div>
                                            <div className={`text-[22px] font-semibold leading-7 ${textColor}`}>
                                                {hhmm(r.startTime)}
                                            </div>
                                            {showDateColumn && (
                                                <div className="text-sm text-zinc-400">{formatListDate(r)}</div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={`truncate text-lg font-semibold leading-6 ${textColor}`}>
                                                {guestName(r)}
                                            </h3>
                                            {!cancelled && (
                                                <div className="mt-1.5">
                                                    <TableChips tables={tablesByReservation.get(r.reservationId)} />
                                                </div>
                                            )}
                                            <div className="mt-1 truncate text-base text-zinc-300">
                                                {r.partySize} {r.partySize === 1 ? "guest" : "guests"} · {r.customer.email}
                                            </div>
                                        </div>
                                        {r.details && !cancelled && (
                                            <div className="col-span-2 flex items-start gap-2 border-t border-card-border pt-3 text-base text-zinc-200">
                                                <NoteIcon />
                                                {r.details}
                                            </div>
                                        )}
                                        {cancelled ? (
                                            <span className="col-start-2 justify-self-start rounded border border-zinc-700 px-2 py-1 text-sm font-semibold text-zinc-300">
                                                Cancelled
                                            </span>
                                        ) : (
                                            <div className="col-span-2 flex gap-2">
                                                <BookingActions
                                                    reservation={r}
                                                    onEdit={() => goEdit(r)}
                                                    onCancel={() => goCancel(r)}
                                                    buttonClassName="flex-1"
                                                />
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </section>

                        <section className="hidden overflow-x-auto rounded-lg border border-card-border bg-card-bg md:block">
                            <table className="w-full border-collapse text-left">
                                <caption className="sr-only">
                                    {filter === "upcoming" ? `Bookings for ${weekday} ${longDate}` : "Reservations"}
                                </caption>
                                <thead className="bg-dark-bg">
                                    <tr className="text-sm font-semibold text-zinc-300">
                                        <th scope="col" className="w-28 border-b border-card-border px-5 py-3.5">Time</th>
                                        <th scope="col" className="border-b border-card-border px-5 py-3.5">Guest</th>
                                        <th scope="col" className="w-20 border-b border-card-border px-5 py-3.5">Party</th>
                                        <th scope="col" className="w-24 border-b border-card-border px-5 py-3.5">Table</th>
                                        <th scope="col" className="border-b border-card-border px-5 py-3.5">Requests</th>
                                        <th scope="col" className="w-56 border-b border-card-border px-5 py-3.5 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((r) => {
                                        const cancelled = isCancelled(r);
                                        return (
                                            <tr key={r.reservationId} className={`text-base ${cancelled ? "bg-white/[.03]" : ""}`}>
                                                <td className="whitespace-nowrap border-b border-card-border px-5 py-4">
                                                    <div className="font-semibold text-white">{hhmm(r.startTime)}</div>
                                                    {showDateColumn && (
                                                        <div className="text-sm text-zinc-400">{formatListDate(r)}</div>
                                                    )}
                                                </td>
                                                <td className="border-b border-card-border px-5 py-4">
                                                    <div className="font-semibold text-white">{guestName(r)}</div>
                                                    <div className="text-[15px] text-zinc-300">{r.customer.email}</div>
                                                </td>
                                                <td className="border-b border-card-border px-5 py-4">{r.partySize}</td>
                                                <td className="border-b border-card-border px-5 py-4">
                                                    {cancelled ? (
                                                        <span className="inline-flex rounded border border-zinc-700 bg-card-bg/60 px-2 py-0.5 text-sm font-semibold text-zinc-300">
                                                            Cancelled
                                                        </span>
                                                    ) : (
                                                        <TableChips tables={tablesByReservation.get(r.reservationId)} />
                                                    )}
                                                </td>
                                                <td
                                                    className={`max-w-xs border-b border-card-border px-5 py-4 ${
                                                        r.details ? "text-zinc-200" : "text-zinc-400"
                                                    }`}
                                                >
                                                    {r.details || "—"}
                                                </td>
                                                <td className="whitespace-nowrap border-b border-card-border px-5 py-4 text-right">
                                                    {!cancelled && (
                                                        <div className="inline-flex gap-2">
                                                            <BookingActions
                                                                reservation={r}
                                                                onEdit={() => goEdit(r)}
                                                                onCancel={() => goCancel(r)}
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </section>
                    </>
                )}
            </div>

            {!isLoading && !error && (
                <div className={`md:block ${view === "floor" ? "block" : "hidden"}`}>
                    {floorError ? (
                        <p className="text-sm text-[#ffb4ab]">{floorError}</p>
                    ) : (
                        <FloorPlan date={selectedDate} isToday={isToday} tables={tables} reservations={floorReservations} />
                    )}
                </div>
            )}
        </OwnerShell>
    );
};
