import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    LabelList,
    type LabelProps,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { ChevronLeft, ChevronRight } from "../components/icons";
import { focusRing, iconBtn, OwnerShell } from "../components/OwnerShell";
import { formatDateKey, getAvailableTimes, parseEuropeanDate } from "../types/reservation";
import { addDays, startOfWeek } from "../utils/date";

type ReservationStats = {
    weekStart: string;
    weekEnd: string;
    totalReservations: number;
    busiestDay: string | null;
    busiestTime: string | null;
    reservationsByDay: Record<string, number>;
    reservationsByTime: Record<string, number>;
};

/** The fields of GET /reservations that the guest stats need. */
type ReservationRow = {
    datetime: string; // "dd.MM.yyyy HH:mm"
    partySize: number;
    status: { name: string } | null;
};

type GuestStats = {
    totalGuests: number;
    averagePartySize: number | null;
    guestsByDay: Record<string, number>;
};

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

/** Series names for charts that compare this week (bars) with last week (line). */
const valueName = "This week";
const compareName = "Last week";

const WEEK_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

/** Backend day key ("MONDAY", ...) of a "dd.MM.yyyy HH:mm" datetime. */
const dayKeyOf = (datetime: string) => WEEK_DAYS[(parseEuropeanDate(datetime).getDay() + 6) % 7];

/**
 * One week's reservations, using the same rules as /reservations/stats:
 * Monday 00:00 up to next Monday, cancelled bookings excluded.
 */
const rowsInWeek = (rows: ReservationRow[], monday: Date): ReservationRow[] => {
    const nextMonday = addDays(monday, 7);
    return rows.filter((r) => {
        if (!r.datetime || r.status?.name === "CANCELLED") return false;
        const d = parseEuropeanDate(r.datetime);
        return d >= monday && d < nextMonday;
    });
};

const computeGuestStats = (rows: ReservationRow[], monday: Date): GuestStats => {
    const week = rowsInWeek(rows, monday);

    const guestsByDay = Object.fromEntries(WEEK_DAYS.map((day) => [day, 0]));

    let totalGuests = 0;
    for (const r of week) {
        guestsByDay[dayKeyOf(r.datetime)] += r.partySize;
        totalGuests += r.partySize;
    }

    return {
        totalGuests,
        averagePartySize: week.length ? totalGuests / week.length : null,
        guestsByDay,
    };
};

/** Reservation counts per weekday and start time: counts[DAY][HH:mm]. */
const computeSlotCounts = (rows: ReservationRow[], monday: Date) => {
    const counts: Record<string, Record<string, number>> = {};
    for (const r of rowsInWeek(rows, monday)) {
        const day = dayKeyOf(r.datetime);
        const time = r.datetime.split(" ")[1]?.slice(0, 5);
        if (!time) continue;
        counts[day] ??= {};
        counts[day][time] = (counts[day][time] ?? 0) + 1;
    }
    return counts;
};

type PartyBucket = {
    label: string;         // "1–2 guests"
    tableLabel: string;    // "2-seat table"
    count: number;
    share: number;         // of the week's bookings, 0..1
    tables: number | null; // tables of this size; null for the overflow group
};

/**
 * Groups party sizes by the smallest table that seats them, e.g. with 2-, 4- and
 * 6-seat tables: 1–2, 3–4, 5–6 and 7+ (tables pushed together).
 */
const computePartyBuckets = (rows: ReservationRow[], monday: Date, capacities: number[]): PartyBucket[] => {
    const week = rowsInWeek(rows, monday);
    const sizes = [...new Set(capacities)].filter((c) => c > 0).sort((a, b) => a - b);
    const buckets: PartyBucket[] = [];
    let low = 1;
    for (const cap of sizes) {
        buckets.push({
            label: low === cap ? `${cap} ${cap === 1 ? "guest" : "guests"}` : `${low}–${cap} guests`,
            tableLabel: `${cap}-seat table`,
            count: week.filter((r) => r.partySize >= low && r.partySize <= cap).length,
            share: 0,
            tables: capacities.filter((c) => c === cap).length,
        });
        low = cap + 1;
    }
    buckets.push({
        label: `${low}+ guests`,
        tableLabel: "tables combined",
        count: week.filter((r) => r.partySize >= low).length,
        share: 0,
        tables: null,
    });
    for (const b of buckets) b.share = week.length ? b.count / week.length : 0;
    return buckets;
};

/** Used for the party-size groups until /tables has loaded (or if it fails). */
const DEFAULT_CAPACITIES = [2, 4, 6];

// Single-series bars: neutral gray, busiest bar(s) in the accent.
// Checked against the #18181D card: contrast >= 3:1, CVD separation ΔE 13.8.
const COLORS = {
    highlight: "#F07EA0", // wine accent, lightened for the dark surface
    bar: "#6B6B73",       // neutral
    grid: "#27272A",      // card-border
    axis: "#D4D4D8",      // zinc-300
    compare: "#D4D4D8",   // comparison line: light ink, dashed, so it reads apart from both bar colours
};

const DAY_LABELS: Record<string, string> = {
    MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
    FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

const DAY_FULL: Record<string, string> = {
    MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday",
    FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};

const toChartDatum = (day: string, value: number): ChartDatum => ({
    label: DAY_LABELS[day] ?? day,
    fullLabel: DAY_FULL[day] ?? day,
    value,
});

/** "16–22 November 2026", or "30 November – 6 December 2026" across months. */
const formatWeekRange = (start: Date, short = false) => {
    const end = addDays(start, 6);
    const month = short ? "short" : "long";
    const sameYear = start.getFullYear() === end.getFullYear();
    const showYear = !short || end.getFullYear() !== new Date().getFullYear();
    const endText = end.toLocaleDateString("en-GB", {
        day: "numeric",
        month,
        ...(showYear && { year: "numeric" }),
    });
    if (start.getMonth() === end.getMonth() && sameYear) {
        return `${start.getDate()}–${endText}`;
    }
    const startText = start.toLocaleDateString("en-GB", {
        day: "numeric",
        month,
        ...(!sameYear && showYear && { year: "numeric" }),
    });
    return `${startText} – ${endText}`;
};

/** Every bookable start time in the week (weekday hours cover Saturday's). */
const ALL_SLOTS = getAvailableTimes(new Date(2024, 0, 1)); // a Monday

/**
 * The backend names a single busiest key and breaks ties by taking the first,
 * so work out every key that shares the top count.
 */
const topKeys = (counts: Record<string, number>): string[] => {
    const max = Math.max(0, ...Object.values(counts));
    return max === 0 ? [] : Object.keys(counts).filter((k) => counts[k] === max);
};

const joinNames = (names: string[]) =>
    names.length <= 1 ? (names[0] ?? "—") : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;

/** `compare` (optional) is drawn as a line over the bars, e.g. last week's value. */
type ChartDatum = { label: string; fullLabel: string; value: number; compare?: number };

type BarChartProps = {
    title: string;
    data: ChartDatum[];
    highlight: string[];
    selected?: string | null;
    onSelect?: (label: string | null) => void;
    /** What one unit of `value` is, for the tooltip and table ("Reservations", "Guests", ...). */
    unit?: string;
    /** Column header for the category in the screen-reader table. */
    categoryName?: string;
    children?: ReactNode;
};

const tooltipProps = {
    cursor: { fill: "rgba(255,255,255,0.05)" },
    contentStyle: {
        backgroundColor: "#18181b",
        border: `1px solid ${COLORS.grid}`,
        borderRadius: 8,
        color: "#fff",
    },
    labelStyle: { color: "#fff", fontWeight: 600 },
    itemStyle: { color: "#D4D4D8" },
};

/**
 * Bar value label for charts with a comparison line. Sits above the bar as usual,
 * but if the line's dot would land on it, moves inside the bar top (when the bar
 * is tall enough) or above the dot.
 */
const AvoidingLabel = ({
    x,
    y,
    width,
    height,
    value,
    data,
    highlight,
}: LabelProps & { data: ChartDatum[]; highlight: string[] }) => {
    // `value` is the category label (see dataKey below), not the number: Recharts
    // skips zero-height bars when numbering labels, so `index` can't be trusted.
    const datum = data.find((d) => d.label === value);
    if (!datum?.value) return null;
    const v = datum.value;
    const [bx, by, bw, bh] = [x, y, width, height].map(Number);
    const centerX = bx + bw / 2;

    const labelBottom = by - 4; // where the label normally sits
    const labelTop = labelBottom - 16;
    const dotY = by + bh - ((datum.compare ?? 0) * bh) / v; // same scale as the bar
    const dotRadius = 6;
    const collides = datum.compare !== undefined && dotY + dotRadius > labelTop && dotY - dotRadius < labelBottom + 4;

    let labelY = labelBottom;
    let fill = "#fff";
    if (collides) {
        if (bh >= 26) {
            labelY = by + 18; // inside the top of the bar
            fill = highlight.includes(datum.label) ? "#18181D" : "#fff"; // contrast on pink vs gray
        } else {
            labelY = dotY - dotRadius - 6; // above the dot
        }
    }

    return (
        <text x={centerX} y={labelY} textAnchor="middle" fill={fill} fontSize={14} fontWeight={600}>
            {v}
        </text>
    );
};

const BarChart = ({
    title,
    data,
    highlight,
    selected = null,
    onSelect,
    unit = "Reservations",
    categoryName = "Day",
    children,
}: BarChartProps) => {
    const hasCompare = data.some((d) => d.compare !== undefined);
    // Bars alone use the original BarChart; a comparison line needs ComposedChart.
    const Chart = hasCompare ? ComposedChart : RechartsBarChart;
    const titleId = `${title.replace(/\s+/g, "-").toLowerCase()}-h`;

    return (
        <section
            aria-labelledby={titleId}
            className="flex flex-col gap-3 rounded-lg border border-card-border bg-card-bg p-4 md:p-6"
        >
            <h2 id={titleId} className="text-lg font-semibold text-white">{title}</h2>
            {children}
            {hasCompare && data.length > 0 && (
                <ul aria-hidden="true" className="m-0 flex list-none flex-wrap gap-5 p-0 text-sm text-zinc-300">
                    <li className="flex items-center gap-2">
                        <i className="h-3.5 w-3.5 rounded-[3px]" style={{ background: COLORS.bar }} />
                        {valueName}
                    </li>
                    <li className="flex items-center gap-2">
                        <svg width="22" height="10">
                            <line x1="0" y1="5" x2="22" y2="5" stroke={COLORS.compare} strokeWidth="2" strokeDasharray="5 4" />
                            <circle cx="11" cy="5" r="3.5" fill={COLORS.compare} />
                        </svg>
                        {compareName}
                    </li>
                </ul>
            )}

            {data.length === 0 ? (
                <p className="text-sm text-zinc-400">No data for this week.</p>
            ) : (
                <>
                    {/* Column charts grow to fill a card that its row-mate has made taller. */}
                    <div className="min-h-64 w-full flex-1" aria-hidden="true">
                        <ResponsiveContainer width="100%" height="100%" debounce={120}>
                            <Chart
                                data={data}
                                barCategoryGap="18%"
                                margin={{ top: 20, right: 8, left: -20, bottom: 0 }}
                            >
                                <CartesianGrid stroke={COLORS.grid} vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    // Many categories (start times): smaller ticks; Recharts skips any that would overlap.
                                    tick={{ fill: COLORS.axis, fontSize: data.length > 8 ? 12 : 14 }}
                                    minTickGap={4}
                                    axisLine={{ stroke: COLORS.grid }}
                                    tickLine={false}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: COLORS.axis, fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    {...tooltipProps}
                                    formatter={(value, name) => [
                                        value as number,
                                        hasCompare ? `${name === compareName ? compareName : valueName} (${unit.toLowerCase()})` : unit,
                                    ]}
                                    labelFormatter={(label) =>
                                        data.find((d) => d.label === label)?.fullLabel ?? String(label)
                                    }
                                />
                                <Bar
                                    dataKey="value"
                                    name={valueName}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                    onClick={
                                        onSelect
                                            ? (_entry, index) => {
                                                const label = data[index]?.label ?? null;
                                                onSelect(label === selected ? null : label);
                                            }
                                            : undefined
                                    }
                                    style={onSelect ? { cursor: "pointer" } : undefined}
                                >
                                    {data.map((item) => (
                                        <Cell
                                            key={item.label}
                                            fill={highlight.includes(item.label) ? COLORS.highlight : COLORS.bar}
                                            stroke={item.label === selected ? "#fff" : undefined}
                                            strokeWidth={item.label === selected ? 2 : 0}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        {...(hasCompare && {
                                            dataKey: "label",
                                            content: (props: LabelProps) => (
                                                <AvoidingLabel {...props} data={data} highlight={highlight} />
                                            ),
                                        })}
                                        // Label only non-zero bars, so empty slots stay quiet.
                                        formatter={(v) => (v === 0 ? "" : String(v))}
                                        fill="#fff"
                                        fontSize={14}
                                        fontWeight={600}
                                    />
                                </Bar>
                                {hasCompare && (
                                    <Line
                                        dataKey="compare"
                                        name={compareName}
                                        type="linear"
                                        stroke={COLORS.compare}
                                        strokeWidth={2}
                                        strokeDasharray="5 4"
                                        // Surface-coloured ring keeps dots legible where they cross a bar.
                                        dot={{ r: 4, fill: COLORS.compare, stroke: "#18181D", strokeWidth: 2 }}
                                        activeDot={{ r: 6, fill: COLORS.compare, stroke: "#18181D", strokeWidth: 2 }}
                                        isAnimationActive={false}
                                    />
                                )}
                            </Chart>
                        </ResponsiveContainer>
                    </div>

                    {/* Same numbers as a table for screen readers. Wrapped, because a
                        <table> ignores sr-only's 1px width and widened the page on phones. */}
                    <div className="sr-only">
                        <table>
                            <caption>{title}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">{categoryName}</th>
                                    <th scope="col">{hasCompare ? `${unit}, ${valueName.toLowerCase()}` : unit}</th>
                                    {hasCompare && <th scope="col">{`${unit}, ${compareName.toLowerCase()}`}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((d) => (
                                    <tr key={d.label}>
                                        <th scope="row">{d.fullLabel}</th>
                                        <td>{d.value}{highlight.includes(d.label) ? " (highest)" : ""}</td>
                                        {hasCompare && <td>{d.compare ?? 0}</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
};

const pct = (x: number) => `${Math.round(x * 100)}%`;

const PartySizeCard = ({ buckets, totalTables }: { buckets: PartyBucket[]; totalTables: number | null }) => {
    const max = Math.max(0, ...buckets.map((b) => b.count));
    const top = buckets.filter((b) => max > 0 && b.count === max);
    return (
        <section aria-labelledby="party-sizes-h" className="flex flex-col gap-4 rounded-lg border border-card-border bg-card-bg p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h2 id="party-sizes-h" className="text-lg font-semibold text-white">Party sizes</h2>
                <p className="text-base text-zinc-300">
                    {top.length ? `Most common: ${joinNames(top.map((b) => b.label))}` : "No bookings this week."}
                </p>
                <p className="text-sm text-zinc-400">Grouped by the table size each party needs.</p>
            </div>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {buckets.map((b) => (
                    <li key={b.label} className="flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-base font-semibold text-white">
                                {b.label}
                                <span className="ml-2 text-sm font-normal text-zinc-400">{b.tableLabel}</span>
                            </span>
                            <span className="whitespace-nowrap text-base text-white">
                                <span className="font-semibold">{pct(b.share)}</span>
                                <span className="ml-1.5 text-sm text-zinc-400">
                                    ({b.count} {b.count === 1 ? "booking" : "bookings"})
                                </span>
                            </span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
                            <div
                                className="h-full rounded-full"
                                style={{ width: pct(b.share), background: top.includes(b) ? COLORS.highlight : COLORS.bar }}
                            />
                        </div>
                        {totalTables != null && b.tables != null && (
                            <p className="text-sm text-zinc-400">
                                {b.tables} of {totalTables} tables ({pct(b.tables / totalTables)})
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );
};

/**
 * "12" -> "12:00–13:00". The last bookable hour only has its :00 slot
 * (bookings stop at 17:00), so it reads "17:00" rather than "17:00–18:00".
 */
const hourRange = (h: string) =>
    ALL_SLOTS.includes(`${h}:30`)
        ? `${h}:00–${String(Number(h) + 1).padStart(2, "0")}:00`
        : `${h}:00`;

type StartTimeCardProps = {
    counts: Record<string, Record<string, number>>;
    /** Short day label ("Mon"), shared with the "Reservations by day" chart. null = whole week. */
    selectedDay: string | null;
    onSelectDay: (label: string | null) => void;
};

/** Reservations per hour of the day, for the whole week or one chosen day. */
const StartTimeCard = ({ counts, selectedDay, onSelectDay }: StartTimeCardProps) => {
    // Sunday is closed; only offer it if something was booked anyway.
    const days = WEEK_DAYS.filter((d) => d !== "SUNDAY" || Object.keys(counts.SUNDAY ?? {}).length > 0);
    const dayKey = days.find((d) => DAY_LABELS[d] === selectedDay) ?? null;
    const shownDays = dayKey ? [dayKey] : days;

    const hours = [
        ...new Set([...ALL_SLOTS, ...days.flatMap((d) => Object.keys(counts[d] ?? {}))].map((t) => t.slice(0, 2))),
    ].sort();
    const rows = hours.map((h) => ({
        hour: h,
        count: shownDays.reduce(
            (n, d) => n + Object.entries(counts[d] ?? {}).reduce((m, [t, c]) => (t.startsWith(h) ? m + c : m), 0),
            0,
        ),
    }));
    const total = rows.reduce((n, r) => n + r.count, 0);
    const max = Math.max(0, ...rows.map((r) => r.count));
    const top = rows.filter((r) => max > 0 && r.count === max);
    const scope = dayKey ? `on ${DAY_FULL[dayKey]}` : "this week";

    const chip = (label: string, value: string | null) => {
        const active = selectedDay === value;
        return (
            <button
                key={label}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectDay(value)}
                className={`min-h-10 rounded-full border px-3.5 text-sm font-medium ${focusRing} ${active ? "border-[#B52252] bg-[#B52252]/20 text-white" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    }`}
            >
                {label}
            </button>
        );
    };

    return (
        <section aria-labelledby="start-times-h" className="flex flex-col gap-4 rounded-lg border border-card-border bg-card-bg p-4 md:p-6">
            <div className="flex flex-col gap-1">
                <h2 id="start-times-h" className="text-lg font-semibold text-white">Reservations by start time</h2>
                <p aria-live="polite" className="text-base text-zinc-300">
                    {top.length
                        ? `Busiest ${scope}: ${joinNames(top.map((r) => hourRange(r.hour)))} with ${max} ${max === 1 ? "reservation" : "reservations"}`
                        : `No reservations ${scope}.`}
                </p>
            </div>
            <div role="group" aria-label="Show day" className="flex flex-wrap gap-2">
                {chip("All week", null)}
                {days.map((d) => chip(DAY_LABELS[d], DAY_LABELS[d]))}
            </div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {rows.map((r) => (
                    <li key={r.hour} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3">
                        <span className="text-sm tabular-nums text-zinc-300">{hourRange(r.hour)}</span>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: max ? `${(r.count / max) * 100}%` : 0,
                                    background: top.includes(r) ? COLORS.highlight : COLORS.bar,
                                }}
                            />
                        </div>
                        <span className="text-right text-sm tabular-nums text-white">
                            <span className="font-semibold">{r.count}</span>
                            {total > 0 && <span className="ml-1.5 text-zinc-400">{pct(r.count / total)}</span>}
                        </span>
                    </li>
                ))}
            </ul>
        </section>
    );
};

/** Summary box. All boxes share one size so the row lines up evenly. */
const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col justify-between gap-2 rounded-lg border border-card-border bg-card-bg p-4 md:p-5">
        <p className="text-sm font-semibold text-zinc-300">{label}</p>
        <p className="text-[28px] font-semibold leading-9 text-white tabular-nums">{value}</p>
    </div>
);

export const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
    const [stats, setStats] = useState<ReservationStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [reservationRows, setReservationRows] = useState<ReservationRow[] | null>(null);
    const [guestError, setGuestError] = useState<string | null>(null);
    const [tableCapacities, setTableCapacities] = useState<number[] | null>(null);

    // All reservations, for the guest stats the stats endpoint doesn't provide.
    // Loaded once; the week filter is applied client-side.
    useEffect(() => {
        const loadReservations = async () => {
            try {
                const response = await fetch(`${API_URL}/reservations`, { credentials: "include" });
                if (!response.ok) throw new Error();
                setReservationRows((await response.json()) as ReservationRow[]);
            } catch {
                setGuestError("Unable to load guest statistics.");
            }
        };
        loadReservations();
    }, []);

    // Table sizes, to group party sizes by the table they need. Optional: on
    // failure the groups fall back to DEFAULT_CAPACITIES without table shares.
    useEffect(() => {
        fetch(`${API_URL}/tables`, { credentials: "include" })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((tables: { capacity: number }[]) => setTableCapacities(tables.map((t) => t.capacity)))
            .catch(() => setTableCapacities(null));
    }, []);

    useEffect(() => {
        const loadStats = async () => {
            setIsLoading(true);
            setError(null);
            setSelectedDay(null);
            try {
                const response = await fetch(
                    `${API_URL}/reservations/stats?weekStart=${formatDateKey(weekStart)}`,
                    { credentials: "include" }
                );

                if (response.status === 401) {
                    navigate("/login");
                    return;
                }
                if (response.status === 403) {
                    throw new Error("You do not have access to analytics.");
                }
                if (!response.ok) {
                    throw new Error("Unable to load statistics.");
                }

                setStats((await response.json()) as ReservationStats);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Unable to load statistics.");
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, [weekStart, navigate]);

    const changeWeek = (offset: number) => setWeekStart(addDays(weekStart, offset * 7));

    const isThisWeek = formatDateKey(weekStart) === formatDateKey(startOfWeek(new Date()));

    const dayData: ChartDatum[] = stats
        ? Object.entries(stats.reservationsByDay).map(([day, value]) => toChartDatum(day, value))
        : [];

    // The API only returns start times that have bookings; fill in the empty
    // slots so the gaps between busy times are visible.
    const timeData: ChartDatum[] = stats
        ? [...new Set([...ALL_SLOTS, ...Object.keys(stats.reservationsByTime)])]
            .sort()
            .map((time) => ({ label: time, fullLabel: time, value: stats.reservationsByTime[time] ?? 0 }))
        : [];

    const busiestDays = stats ? topKeys(stats.reservationsByDay) : [];
    const busiestTimes = stats ? topKeys(stats.reservationsByTime) : [];
    const busiestDayLabels = busiestDays.map((d) => DAY_LABELS[d] ?? d);
    const busiestDayNames = busiestDays.map((d) => DAY_FULL[d] ?? d);
    const topDayCount = busiestDays.length ? stats!.reservationsByDay[busiestDays[0]] : 0;

    const guests = reservationRows ? computeGuestStats(reservationRows, weekStart) : null;
    const lastWeekGuests = reservationRows ? computeGuestStats(reservationRows, addDays(weekStart, -7)) : null;

    const guestDayData: ChartDatum[] = guests
        ? Object.entries(guests.guestsByDay).map(([day, value]) => ({
            ...toChartDatum(day, value),
            compare: lastWeekGuests?.guestsByDay[day] ?? 0,
        }))
        : [];
    const topGuestDays = guests ? topKeys(guests.guestsByDay).map((d) => DAY_LABELS[d] ?? d) : [];

    const partyBuckets = reservationRows
        ? computePartyBuckets(reservationRows, weekStart, tableCapacities?.length ? tableCapacities : DEFAULT_CAPACITIES)
        : [];
    const slotCounts = reservationRows ? computeSlotCounts(reservationRows, weekStart) : null;

    const nextWeekStart = addDays(weekStart, 7);
    const weeklyReservations = reservationRows?.filter(({ datetime }) => {
        if (!datetime) return false;
        const date = parseEuropeanDate(datetime);
        return date >= weekStart && date < nextWeekStart;
    });
    const totalBookings = weeklyReservations?.length ?? 0;
    const cancelledBookings = weeklyReservations?.filter(
        (row) => row.status?.name === "CANCELLED",
    ).length ?? 0;

    const cancellationRate = totalBookings > 0
        ? (cancelledBookings / totalBookings).toLocaleString("en-GB", {
            style: "percent",
            maximumFractionDigits: 1,
        })
        : "No reservations";

    const picked = dayData.find((d) => d.label === selectedDay);
    const dayReadout = picked
        ? `${picked.fullLabel}: ${picked.value} reservations${busiestDayLabels.includes(picked.label) ? " (busiest)" : ""}`
        : busiestDays.length
            ? `Busiest: ${joinNames(busiestDayNames)} with ${topDayCount} reservations`
            : "No reservations this week.";

    const weekNav = (
        <div role="group" aria-label="Choose week" className="flex gap-2">
            <button type="button" aria-label="Previous week" onClick={() => changeWeek(-1)} className={`${iconBtn} h-12 w-12`}>
                <ChevronLeft />
            </button>
            <button
                type="button"
                aria-pressed={isThisWeek}
                onClick={() => setWeekStart(startOfWeek(new Date()))}
                className={`min-h-12 flex-1 rounded border px-4 text-base font-medium md:flex-none ${focusRing} ${isThisWeek ? "border-[#B52252] bg-card-bg text-white" : "border-zinc-700 text-zinc-200 hover:bg-card-bg"
                    }`}
            >
                This week
            </button>
            <button type="button" aria-label="Next week" onClick={() => changeWeek(1)} className={`${iconBtn} h-12 w-12`}>
                <ChevronRight />
            </button>
        </div>
    );

    const weekKicker = isThisWeek ? "This week" : "Week";

    return (
        <OwnerShell
            active="analytics"
            mobileHeader={
                <div>
                    <div className="text-sm font-semibold text-zinc-300">Stats · {weekKicker}</div>
                    <h1 className="text-[26px] font-semibold leading-8 text-white">
                        {formatWeekRange(weekStart, true)}
                    </h1>
                </div>
            }
        >
            <header className="hidden items-end justify-between gap-4 md:flex">
                <div>
                    <div className="text-sm font-semibold text-zinc-300">Analytics · {weekKicker}</div>
                    <h1 className="whitespace-nowrap text-[32px] font-medium leading-10 text-white lg:text-4xl lg:leading-11">
                        {formatWeekRange(weekStart)}
                    </h1>
                </div>
                {weekNav}
            </header>
            <div className="md:hidden">{weekNav}</div>

            {isLoading && <p className="text-sm text-zinc-400">Loading statistics...</p>}
            {error && <p className="text-sm text-[#ffb4ab]">{error}</p>}

            {!isLoading && !error && stats && (
                <div className="flex flex-col gap-5 md:gap-6">
                    {/* Four equal boxes: 2 × 2 on phones, one row from lg up. Busiest
                        time lives in the start-time card below, so it isn't repeated here. */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                        <StatCard label="Reservations" value={String(stats.totalReservations)} />
                        <StatCard label="Guests" value={guests ? String(guests.totalGuests) : "—"} />
                        <StatCard
                            label="Avg party size"
                            value={guests?.averagePartySize != null ? guests.averagePartySize.toFixed(1) : "—"}
                        />
                        <StatCard label="Busiest day" value={joinNames(busiestDayNames)} />
                    </div>
                    {weeklyReservations && (
                        <StatCard
                            label={totalBookings > 0
                                ? `Cancellation rate · ${cancelledBookings} of ${totalBookings} bookings cancelled`
                                : "Cancellation rate"}
                            value={cancellationRate}
                        />
                    )}

                    {/* Mobile: one column, most-checked first, the long start-time list last.
                        Desktop: day charts side by side; start times under reservations,
                        party sizes under guests (lg:order puts the list in the left column). */}
                    <div className="grid gap-5 md:gap-6 lg:grid-cols-2">
                        <BarChart
                            title="Reservations by day"
                            data={dayData}
                            highlight={busiestDayLabels}
                            selected={selectedDay}
                            onSelect={setSelectedDay}
                        >
                            <p aria-live="polite" className="text-base text-zinc-300">{dayReadout}</p>
                            <p className="text-sm text-zinc-400">Tap a day for details and its start times.</p>
                        </BarChart>
                        {guestError ? (
                            <p className="text-sm text-[#ffb4ab]">{guestError}</p>
                        ) : (
                            <BarChart
                                title="Guests by day"
                                data={guestDayData}
                                highlight={topGuestDays}
                                unit="Guests"
                            >
                                <p className="text-base text-zinc-300">
                                    {topGuestDays.length
                                        ? `Most guests: ${joinNames(
                                            guestDayData.filter((d) => topGuestDays.includes(d.label)).map((d) => d.fullLabel),
                                        )} with ${Math.max(...guestDayData.map((d) => d.value))}`
                                        : "No guests this week."}
                                </p>
                            </BarChart>
                        )}
                        {!guestError && reservationRows && (
                            <div className="flex flex-col lg:order-2 [&>section]:flex-1">
                                <PartySizeCard
                                    buckets={partyBuckets}
                                    totalTables={tableCapacities?.length ? tableCapacities.length : null}
                                />
                            </div>
                        )}
                        <div className="flex flex-col lg:order-1 [&>section]:flex-1">
                            {slotCounts ? (
                                <StartTimeCard counts={slotCounts} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
                            ) : (
                                // Reservation list unavailable: fall back to the per-slot totals from /stats.
                                <BarChart
                                    title="Reservations by start time"
                                    data={timeData}
                                    highlight={busiestTimes}
                                    categoryName="Start time"
                                />
                            )}
                        </div>
                    </div>

                    <p className="text-sm text-zinc-400">
                        Cancelled bookings are excluded; unconfirmed ones are included.
                    </p>
                </div>
            )}
        </OwnerShell>
    );
};
