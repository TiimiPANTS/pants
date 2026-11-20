import { test, expect } from '@playwright/test';
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
import {
    DASHBOARD_URL,
    bookingRow,
    cancelBookingButtons,
    showAllDates,
    signInAsOwner,
} from './helpers/dashboardHelpers.ts';

// System test: runs against the real frontend + backend + database (no mocks).
// Owner credentials come from the backend seed (TestLoginConfig) unless overridden.
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'owner@test.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? 'owner123';

// Time slot not used by the other real-database tests
const RESERVATION_TIME = '15:00';

test.describe.configure({ mode: 'serial' });

test('customer books, owner cancels, customer sees the cancellation', async ({ browser, request }) => {
    // Unique email so the booking row can be found reliably on the dashboard
    const customerEmail = `system-${Date.now()}@example.com`;

    // Separate browser contexts = separate sessions, like two real users
    const customerContext = await browser.newContext();
    const ownerContext = await browser.newContext();
    const customer = await customerContext.newPage();
    const owner = await ownerContext.newPage();
    let editToken: string | undefined;

    try {
        await test.step('customer books a table', async () => {
            await openNewReservationPage(customer);
            await chooseNextMonthDay(customer, reservationDate());
            await chooseTime(customer, RESERVATION_TIME);
            await fillContactDetails(customer, { firstName: 'System', lastName: 'Test', email: customerEmail });
            await confirmReservation(customer);

            await reservationForm(customer).editButton.click();
            await expect(reservationForm(customer).editHeading).toBeVisible();
            editToken = editTokenFromUrl(customer);
        });

        const row = bookingRow(owner, customerEmail);

        await test.step('owner finds the booking on the dashboard', async () => {
            await signInAsOwner(owner, OWNER_EMAIL, OWNER_PASSWORD);
            await showAllDates(owner);

            await expect(row).toBeVisible();
            await expect(row).toContainText('System Test');
        });

        await test.step('owner cancels the booking', async () => {
            await cancelBookingButtons(row).click();
            await expect(owner.getByRole('heading', { name: 'Cancel reservation' })).toBeVisible();
            await owner.getByRole('button', { name: 'Yes' }).click();

            await expect(owner).toHaveURL(DASHBOARD_URL);
            await showAllDates(owner);
            await expect(row.getByText('Cancelled', { exact: true })).toBeVisible();
            await expect(cancelBookingButtons(row)).toHaveCount(0);
        });

        await test.step('customer sees the booking is cancelled', async () => {
            await customer.goto(`/reserve/${editToken}`);
            await expect(customer.getByRole('heading', { name: 'Reservation cancelled' })).toBeVisible();
            await expect(customer.getByRole('button', { name: 'Cancel Reservation' })).toHaveCount(0);
        });
    } finally {
        // Cleanup in case the test failed before the owner cancelled
        if (editToken) await cancelReservationViaApi(request, editToken);
        await ownerContext.close();
        await customerContext.close();
    }
});
