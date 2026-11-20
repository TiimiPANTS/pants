import { expect, type Locator, type Page } from '@playwright/test';

export const DASHBOARD_URL = /\/dashboard$/;

export const cancelPageUrl = (reservationId: number) =>
    new RegExp(`/owner/reservations/${reservationId}/cancel$`);

// The dashboard opens on today's bookings; tests that use other dates switch to "All dates"
export async function showAllDates(page: Page) {
    await page.getByRole('button', { name: 'All dates' }).click();
}

export function reservationsTable(page: Page) {
    return page.getByRole('table', { name: 'Reservations' });
}

export function bookingRow(page: Page, text: string) {
    return page.getByRole('row').filter({ hasText: text });
}

// Matches the row's "Cancel booking for ..." action, not the "Cancelled" filter button
export function cancelBookingButtons(scope: Page | Locator) {
    return scope.getByRole('button', { name: /^Cancel booking for/ });
}

export async function signIn(page: Page, email: string, password: string) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function signInAsOwner(page: Page, email: string, password: string) {
    await signIn(page, email, password);
    await expect(page).toHaveURL(DASHBOARD_URL);
}
