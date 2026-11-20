/**
 * Restaurant opening hours, shown on the home page and the reservation form.
 * `match` uses Date.getDay() numbers (0 = Sunday); `hours` is [open, close] or null when closed.
 * Note: the last bookable time (17:00) is set separately in types/reservation.ts.
 */
type OpeningHoursRow = {
  days: string;
  short: string;
  match: number[];
  hours: [number, number] | null;
};

export const formatHour = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

const rows: OpeningHoursRow[] = [
  { days: "Monday – Friday", short: "Mon–Fri", match: [1, 2, 3, 4, 5], hours: [10, 20] },
  { days: "Saturday", short: "Sat", match: [6], hours: [11, 20] },
  { days: "Sunday", short: "Sun", match: [0], hours: null },
];

export const openingHours = rows.map((row) => ({
  ...row,
  time: row.hours ? `${formatHour(row.hours[0])} – ${formatHour(row.hours[1])}` : "Closed",
}));

/** [open, close] hours for a Date.getDay() number, or null when closed. */
export const hoursOn = (day: number) => rows.find((row) => row.match.includes(day))?.hours ?? null;
