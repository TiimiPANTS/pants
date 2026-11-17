import { test, expect, type Page } from '@playwright/test';
import {
    cancelReservationViaApi,
    chooseNextMonthDay,
    chooseTime,
    confirmReservation,
    editTokenFromUrl,
    fillContactDetails,
    openNewReservationPage,
    reservationDate,
    reservationForm,
} from './helpers/reservationHelpers.ts';

// System test: runs against the real frontend + backend + database (no mocks).
// Owner credentials come from the backend seed (TestLoginConfig) unless overridden.
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'owner@test.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? 'owner123';

// Time slot not used by the other real-database tests
const RESERVATION_TIME = '15:00';

test.describe.configure({ mode: 'serial' });

async function loginAsOwner(page: Page) {
    await page.goto('/login');
    await page.getByLabel('Email').fill(OWNER_EMAIL);
    await page.getByLabel('Password').fill(OWNER_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/owner\/dashboard$/);
}

test('reservation lifecycle: customer books, owner cancels, customer sees the cancellation', async ({ browser, request }) => {
    // Unique email so the reservation row can be found reliably on the dashboard
    const customerEmail = `system-${Date.now()}@example.com`;

    // --- Customer makes a reservation in the UI ---
    const customerContext = await browser.newContext();
    const customer = await customerContext.newPage();

    await openNewReservationPage(customer);
    await chooseNextMonthDay(customer, reservationDate());
    await chooseTime(customer, RESERVATION_TIME);
    await fillContactDetails(customer, { firstName: 'System', lastName: 'Test', email: customerEmail });
    await confirmReservation(customer);

    await reservationForm(customer).editButton.click();
    await expect(reservationForm(customer).editHeading).toBeVisible();
    const editToken = editTokenFromUrl(customer);

    // Separate browser context = separate session, like a real second user
    const ownerContext = await browser.newContext();
    const owner = await ownerContext.newPage();

    try {
        // --- Owner logs in and finds the reservation on the dashboard ---
        await loginAsOwner(owner);

        const reservationRow = owner.getByRole('row').filter({ hasText: customerEmail });
        await expect(reservationRow).toBeVisible();
        await expect(reservationRow).toContainText('System Test');

        // --- Owner cancels the reservation ---
        await reservationRow.getByRole('button', { name: 'Cancel' }).click();
        await expect(owner.getByRole('heading', { name: 'Cancel reservation' })).toBeVisible();
        await owner.getByRole('button', { name: 'Yes' }).click();

        await expect(owner).toHaveURL(/\/owner\/dashboard$/);
        await expect(reservationRow.getByText('Cancelled')).toBeVisible();
        await expect(reservationRow.getByRole('button', { name: 'Cancel' })).toHaveCount(0);

        // --- Customer reopens the edit link and sees the reservation is cancelled ---
        await customer.goto(`/reserve/${editToken}`);
        await expect(customer.getByRole('heading', { name: 'Reservation cancelled' })).toBeVisible();
        await expect(customer.getByRole('button', { name: 'Cancel Reservation' })).toHaveCount(0);
    } finally {
        // Safety net if the test fails before the owner cancels
        await cancelReservationViaApi(request, editToken);
        await ownerContext.close();
        await customerContext.close();
    }
});
