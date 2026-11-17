import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { BUTTONS, HEADINGS, ROUTES, TEXTBOXES } from './elements.ts';

export const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';

const HTTP_CREATED = 201;

// ---------- dates ----------

const SUNDAY = 0;
const PREFERRED_DAY_OF_MONTH = 10;
const FALLBACK_DAY_OF_MONTH = 11; //  If the 10th of next month is a Sunday, the test books Monday the 11th instead.
const DATE_LOCALE = 'en-US';

// The 10th of next month, or the 11th if the 10th is a Sunday (restaurant is closed)
export function reservationDate(): Date {
    const date = new Date();
    const nextMonth = date.getMonth() + 1;
    date.setMonth(nextMonth, PREFERRED_DAY_OF_MONTH);

    const isSunday = date.getDay() === SUNDAY;
    if (isSunday) {
        date.setDate(FALLBACK_DAY_OF_MONTH);
    }
    return date;
}

//  makes sure a number always has two digits by adding a zero in front when needed
function padToTwoDigits(value: number): string {
    return String(value).padStart(2, '0');
} 

// "10.12.2026" – the format the backend expects
export function backendDate(date: Date): string {
    const day = padToTwoDigits(date.getDate());
    const month = padToTwoDigits(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// 1 -> "st", 2 -> "nd", 3 -> "rd", 11 -> "th", 22 -> "nd" ...
function ordinalSuffix(dayOfMonth: number): string {
    const isTeen = dayOfMonth >= 11 && dayOfMonth <= 13;
    if (isTeen) return 'th';

    switch (dayOfMonth % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// "Thursday, December 10th, 2026" – the date picker's button name
export function dayLabel(date: Date): string {
    const dayOfMonth = date.getDate();
    const weekdayName = date.toLocaleDateString(DATE_LOCALE, { weekday: 'long' });
    const monthName = date.toLocaleDateString(DATE_LOCALE, { month: 'long' });
    const year = date.getFullYear();
    return `${weekdayName}, ${monthName} ${dayOfMonth}${ordinalSuffix(dayOfMonth)}, ${year}`;
}

// ---------- locators (role based) ----------

export function reservationForm(page: Page) {
    return {
        nextMonthButton: page.getByRole('button', { name: BUTTONS.nextMonth }),
        dayButton: (date: Date) => page.getByRole('button', { name: dayLabel(date) }),
        timeButton: (time: string) => page.getByRole('button', { name: new RegExp(`^${time},`) }),
        guestCount: page.getByRole('spinbutton'),
        increaseGuestsButton: page.getByRole('button', { name: BUTTONS.increaseGuests, exact: true }),
        firstName: page.getByRole('textbox', { name: TEXTBOXES.firstName }),
        lastName: page.getByRole('textbox', { name: TEXTBOXES.lastName }),
        email: page.getByRole('textbox', { name: TEXTBOXES.email }),
        specialRequests: page.getByRole('textbox', { name: TEXTBOXES.specialRequests }),
        confirmButton: page.getByRole('button', { name: BUTTONS.confirmReservation }),
        updateButton: page.getByRole('button', { name: BUTTONS.updateReservation }),
        editButton: page.getByRole('button', { name: BUTTONS.editReservation }),
        editHeading: page.getByRole('heading', { name: HEADINGS.editReservation }),
        confirmedHeading: page.getByRole('heading', { name: HEADINGS.reservationConfirmed }),
    };
}

// ---------- UI actions ----------

export async function openNewReservationPage(page: Page) {
    await page.goto(ROUTES.reserve);
}

export async function openEditPage(page: Page, editToken: string) {
    await page.goto(ROUTES.editReservation(editToken));
    await expect(reservationForm(page).editHeading).toBeVisible();
}

export async function chooseNextMonthDay(page: Page, date: Date) {
    const form = reservationForm(page);
    await form.nextMonthButton.click();
    await form.dayButton(date).click();
}

export async function chooseTime(page: Page, time: string) {
    const timeButton = reservationForm(page).timeButton(time);
    await expect(timeButton).toBeEnabled();
    await timeButton.click();
}

export async function fillContactDetails(
    page: Page,
    contact: { firstName: string; lastName: string; email: string },
) {
    const form = reservationForm(page);
    await form.firstName.fill(contact.firstName);
    await form.lastName.fill(contact.lastName);
    await form.email.fill(contact.email);
}

export async function confirmReservation(page: Page) {
    const form = reservationForm(page);
    await form.confirmButton.click();
    await expect(form.confirmedHeading).toBeVisible();
}

export async function updateReservation(page: Page) {
    const form = reservationForm(page);
    await form.updateButton.click();
    await expect(form.confirmedHeading).toBeVisible();
}

// ---------- backend API ----------

const RESERVATIONS_API = `${BACKEND}/api/reservations`;
const manageReservationUrl = (editToken: string) => `${RESERVATIONS_API}/manage/${editToken}`;

export async function createReservationViaApi(request: APIRequestContext): Promise<string> {
    const response = await request.post(RESERVATIONS_API, {
        data: {
            customer: { firstname: 'Testi', lastname: 'Tester', email: 'e2e@example.com' },
            datetime: `${backendDate(reservationDate())} 12:00`,
            startTime: '12:00',
            endTime: '14:00',
            partySize: 2,
            details: '',
        },
    });
    expect(response.status()).toBe(HTTP_CREATED);

    const createdReservation = await response.json();
    return createdReservation.editToken;
}

export async function getReservationViaApi(request: APIRequestContext, editToken: string) {
    const response = await request.get(manageReservationUrl(editToken));
    expect(response.ok()).toBeTruthy();
    return response.json();
}

export async function cancelReservationViaApi(request: APIRequestContext, editToken: string) {
    await request.patch(`${manageReservationUrl(editToken)}/cancel`);
}

export function editTokenFromUrl(page: Page): string {
    return page.url().split(`${ROUTES.reserve}/`)[1];
}
