import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";


type ReservationStats = {
    weekStart: string;
    weekEnd: string;
    totalReservations: number;
    busiestDay: string | null;
    busiestTime: string | null;
    reservationsByDay: Record<string, number>;
    reservationsByTime: Record<string, number>;
};

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

const COLORS = {
    highlight: "#a3284d", // wine-light
    bar: "#52525b",       // zinc-600
    grid: "#272832",      // card-border
    axis: "#a1a1aa",      // zinc-400
};

const DAY_LABELS: Record<string, string> = {
    MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
    FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

const DAY_FULL: Record<string, string> = {
    MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday",
    FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday",
};

// Palauttaa viikon maanantain muodossa YYYY-MM-DD (paikallinen aika)
const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const diff = (d.getDay() + 6) % 7; // ma = 0
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

const toIsoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
};


type BarChartProps = {
    title: string;
    data: { label: string; value: number }[];
    highlight: string | null;
};

const BarChart = ({ title, data, highlight }: BarChartProps) => (
    <section className="rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-6 font-headline text-lg font-semibold">{title}</h2>

        {data.length === 0 ? (
            <p className="text-sm text-zinc-400">No data for this week.</p>
        ) : (
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={data} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke={COLORS.grid} vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: COLORS.axis, fontSize: 12 }}
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
                            cursor={{ fill: "rgba(255,255,255,0.05)" }}
                            contentStyle={{
                                backgroundColor: "#18181b",
                                border: `1px solid ${COLORS.grid}`,
                                borderRadius: 8,
                                color: "#fff",
                            }}
                            formatter={(value) => [value, "Reservations"]}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {data.map((item) => (
                                <Cell
                                    key={item.label}
                                    fill={item.label === highlight ? COLORS.highlight : COLORS.bar}
                                />
                            ))}
                            <LabelList dataKey="value" position="top" fill="#d4d4d8" fontSize={12} />
                        </Bar>
                    </RechartsBarChart>
                </ResponsiveContainer>
            </div>
        )}
    </section>
);


const StatCard = ({ label, value }: { label: string; value: string }) => (
    <div className="rounded-xl border border-card-border bg-card-bg p-5">
        <p className="text-xs uppercase tracking-wider text-zinc-400">{label}</p>
        <p className="mt-2 font-headline text-2xl font-semibold">{value}</p>
    </div>
);

export const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
    const [stats, setStats] = useState<ReservationStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `${API_URL}/reservations/stats?weekStart=${toIsoDate(weekStart)}`,
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

    const changeWeek = (offset: number) => {
        const next = new Date(weekStart);
        next.setDate(next.getDate() + offset * 7);
        setWeekStart(next);
    };

    const dayData = stats
        ? Object.entries(stats.reservationsByDay).map(([day, value]) => ({
              label: DAY_LABELS[day] ?? day,
              value,
          }))
        : [];

    const timeData = stats
        ? Object.entries(stats.reservationsByTime).map(([time, value]) => ({ label: time, value }))
        : [];

    const buttonClass =
        "rounded border border-card-border px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-card-bg hover:text-white";

    return (
        <main className="min-h-screen bg-dark-bg px-4 py-8 text-white sm:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-card-border pb-6">
                    <div>
                        <h1 className="font-headline text-3xl font-semibold">Analytics</h1>
                        <p className="mt-1 text-sm text-zinc-400">
                            {stats
                                ? `Week ${formatDate(stats.weekStart)} – ${formatDate(stats.weekEnd)}`
                                : "Weekly reservation statistics"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => changeWeek(-1)} className={buttonClass}>
                            ← Previous week
                        </button>
                        <button type="button" onClick={() => setWeekStart(getMonday(new Date()))} className={buttonClass}>
                            This week
                        </button>
                        <button type="button" onClick={() => changeWeek(1)} className={buttonClass}>
                            Next week →
                        </button>
                        <button type="button" onClick={() => navigate("/owner/dashboard")} className={buttonClass}>
                            Back to dashboard
                        </button>
                    </div>
                </header>

                {isLoading && <p className="text-sm text-zinc-400">Loading statistics...</p>}
                {error && <p className="text-sm text-red-400">{error}</p>}

                {!isLoading && !error && stats && (
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-4 sm:grid-cols-3">
                            <StatCard label="Reservations this week" value={String(stats.totalReservations)} />
                            <StatCard
                                label="Busiest day"
                                value={stats.busiestDay ? DAY_FULL[stats.busiestDay] : "—"}
                            />
                            <StatCard label="Busiest time" value={stats.busiestTime ?? "—"} />
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <BarChart
                                title="Reservations by day"
                                data={dayData}
                                highlight={stats.busiestDay ? DAY_LABELS[stats.busiestDay] : null}
                            />
                            <BarChart
                                title="Reservations by start time"
                                data={timeData}
                                highlight={stats.busiestTime}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};
