import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateKey, getAvailableTimes } from "../types/reservation";
import { currentTimeKey } from "../utils/date";

export type FloorTable = {
    id: number;
    tableNumber: number;
    capacity: number;
    status: { id: number; name: string } | null;
};

export type FloorReservation = {
    reservationId: number;
    guestName: string;
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    tableIds: number[];
};

type TableState = "free" | "reserved" | "seated" | "out";

type Props = {
    date: Date;
    isToday: boolean;
    tables: FloorTable[];
    /** Non-cancelled reservations on `date`. */
    reservations: FloorReservation[];
};

// Times can be missing on real data; never call .slice on null.
const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");

/** Whether a booking occupies its table at `slot`. Bookings without both times never do. */
const covers = (r: FloorReservation, slot: string) =>
    Boolean(r.startTime && r.endTime) && hhmm(r.startTime) <= slot && slot < hhmm(r.endTime);

const tileClass: Record<TableState, string> = {
    free: "border border-zinc-700 bg-dark-bg text-zinc-200",
    reserved: "border-2 border-dashed border-[#ffb2bf] bg-[#9B1B44]/20 text-zinc-100",
    seated: "border border-[#B52252] bg-[#9B1B44] text-white",
    // Diagonal hatching so it reads differently from "free" by texture, not just a faint border.
    out: "border border-zinc-600 bg-[repeating-linear-gradient(135deg,#52525b_0_2px,transparent_2px_7px)] text-zinc-300",
};

const stateLabel: Record<TableState, string> = {
    free: "free",
    reserved: "reserved",
    seated: "seated",
    out: "out of service",
};

const sizeLabel = (capacity: number) =>
    ({ 2: "Two-seat", 4: "Four-seat", 6: "Six-seat", 8: "Eight-seat" })[capacity] ?? `${capacity}-seat`;

const tileHeight = (capacity: number) => (capacity <= 2 ? "h-12" : capacity <= 4 ? "h-14" : "h-16");

export const FloorPlan = ({ date, isToday, tables, reservations }: Props) => {
    const slots = useMemo(() => getAvailableTimes(date), [date]);

    const defaultSlot = useMemo(() => {
        if (slots.length === 0) return "";
        if (isToday) {
            const now = currentTimeKey();
            const current = slots.findLast((s) => s <= now);
            if (current) return current;
        }
        const firstBooked = slots.find((s) =>
            reservations.some((r) => covers(r, s)),
        );
        return firstBooked ?? slots[0];
    }, [slots, isToday, reservations]);

    // The picked slot only sticks for the day it was picked on; a new day starts at its default.
    const dateKey = formatDateKey(date);
    const [picked, setPicked] = useState<{ dateKey: string; slot: string } | null>(null);
    const slot = picked?.dateKey === dateKey && slots.includes(picked.slot) ? picked.slot : defaultSlot;
    const setSlot = (s: string) => setPicked({ dateKey, slot: s });

    // Keep the selected slot visible in the scrollable row on phones. Only the row's
    // own scrollLeft changes, never the page scroll.
    const slotRowRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const row = slotRowRef.current;
        const button = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
        if (!row || !button || row.scrollWidth <= row.clientWidth) return;
        row.scrollLeft = button.offsetLeft - row.offsetLeft - (row.clientWidth - button.offsetWidth) / 2;
    }, [slot]);

    // Seated status is live table state, so it only applies to the current slot today.
    const showLiveStatus = isToday && slot === defaultSlot;

    const tableInfo = useMemo(() => {
        const info = new Map<number, { state: TableState; booking?: FloorReservation }>();
        for (const table of tables) {
            const status = table.status?.name;
            if (status === "OUT_OF_SERVICE") {
                info.set(table.id, { state: "out" });
                continue;
            }
            const booking = reservations.find(
                (r) => r.tableIds.includes(table.id) && covers(r, slot),
            );
            if (showLiveStatus && status === "OCCUPIED") info.set(table.id, { state: "seated", booking });
            else if (booking) info.set(table.id, { state: "reserved", booking });
            else info.set(table.id, { state: "free" });
        }
        return info;
    }, [tables, reservations, slot, showLiveStatus]);

    const groups = useMemo(() => {
        const byCapacity = new Map<number, FloorTable[]>();
        for (const t of [...tables].sort((a, b) => a.tableNumber - b.tableNumber)) {
            byCapacity.set(t.capacity, [...(byCapacity.get(t.capacity) ?? []), t]);
        }
        return [...byCapacity.entries()].sort(([a], [b]) => a - b);
    }, [tables]);

    const totalSeats = tables
        .filter((t) => tableInfo.get(t.id)?.state !== "out")
        .reduce((sum, t) => sum + t.capacity, 0);
    const heldSeats = tables
        .filter((t) => {
            const s = tableInfo.get(t.id)?.state;
            return s === "reserved" || s === "seated";
        })
        .reduce((sum, t) => sum + t.capacity, 0);
    const pct = totalSeats ? Math.round((heldSeats / totalSeats) * 100) : 0;

    if (slots.length === 0) {
        return (
            <p className="rounded-lg border border-card-border bg-card-bg p-8 text-center text-sm text-zinc-400">
                The restaurant is closed on this day.
            </p>
        );
    }

    if (tables.length === 0) {
        return (
            <p className="rounded-lg border border-card-border bg-card-bg p-8 text-center text-sm text-zinc-400">
                No tables have been set up yet.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Phones: swipe sideways. Desktop: wrap, since a mouse wheel can't scroll a row sideways. */}
            <div
                ref={slotRowRef}
                role="group"
                aria-label="Time slot"
                className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:flex-wrap md:overflow-visible"
            >
                {slots.map((s) => (
                    <button
                        key={s}
                        type="button"
                        aria-pressed={slot === s}
                        onClick={() => setSlot(s)}
                        className={`min-h-12 flex-none rounded-full border px-4 text-base font-medium focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white ${
                            slot === s
                                ? "border-[#B52252] bg-card-bg text-white"
                                : "border-zinc-700 text-zinc-200 hover:bg-card-bg"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <section
                aria-labelledby="floor-h"
                className="flex flex-col gap-4 rounded-lg border border-card-border bg-card-bg p-4 md:p-5"
            >
                <h2 id="floor-h" className="text-lg font-semibold text-white">
                    {heldSeats} of {totalSeats} seats held at {slot}
                </h2>
                <div
                    role="progressbar"
                    aria-label={`Seats occupied at ${slot}`}
                    aria-valuemin={0}
                    aria-valuemax={totalSeats}
                    aria-valuenow={heldSeats}
                    aria-valuetext={`${heldSeats} of ${totalSeats} seats, ${pct} percent`}
                    className="h-2.5 overflow-hidden rounded-full bg-card-border"
                >
                    <div className="h-2.5 rounded-full bg-[#9B1B44]" style={{ width: `${pct}%` }} />
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-6">
                    {groups.map(([capacity, group]) => (
                        <div key={capacity} style={{ flexGrow: group.length }} className="md:basis-0">
                            <div className="mb-2 text-sm font-semibold text-zinc-300">
                                {sizeLabel(capacity)} · {group.length} {group.length === 1 ? "table" : "tables"}
                            </div>
                            <ul
                                className="m-0 grid list-none gap-1.5 p-0"
                                style={{
                                    gridTemplateColumns: `repeat(${Math.min(group.length, 5)}, minmax(0, 1fr))`,
                                }}
                            >
                                {group.map((t) => {
                                    const { state, booking } = tableInfo.get(t.id) ?? { state: "free" as const };
                                    const bookingTime = booking
                                        ? `${hhmm(booking.startTime)}–${hhmm(booking.endTime)}`
                                        : "";
                                    return (
                                        <li
                                            key={t.id}
                                            title={booking ? `${booking.guestName} · ${bookingTime}` : undefined}
                                            aria-label={`Table ${t.tableNumber}, ${stateLabel[state]}${
                                                booking ? `, ${booking.guestName} ${bookingTime}` : ""
                                            }`}
                                            className={`flex items-center justify-center rounded-md text-sm font-semibold ${tileHeight(
                                                capacity,
                                            )} ${tileClass[state]}`}
                                        >
                                            <span aria-hidden="true">T{t.tableNumber}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>

                <ul className="m-0 flex list-none flex-wrap gap-5 p-0 text-[15px] text-zinc-300" aria-label="Legend">
                    {(["free", "reserved", "seated", "out"] as const).map((s) => (
                        <li key={s} className="flex items-center gap-2">
                            <i aria-hidden="true" className={`box-border h-3.5 w-3.5 rounded-[3px] ${tileClass[s]}`} />
                            <span>{stateLabel[s].charAt(0).toUpperCase() + stateLabel[s].slice(1)}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};
