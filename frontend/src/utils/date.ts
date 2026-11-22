export const addDays = (date: Date, days: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

/** Monday 00:00 of the week containing `date`. */
export const startOfWeek = (date: Date) => {
    const daysSinceMonday = (date.getDay() + 6) % 7;
    return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -daysSinceMonday);
};

/** Current local time as "HH:mm". */
export const currentTimeKey = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};
