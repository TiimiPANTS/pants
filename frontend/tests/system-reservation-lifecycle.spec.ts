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
    signIn,
} from './helpers/dashboardHelpers.ts';

// System test: runs against the real frontend + backend + database (no mocks).
// Admin credentials come from the backend seed (TestLoginConfig) unless overridden.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@pants.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

// Time slot not used by the other real-database tests
const RESERVATION_TIME = '15:00';

test.describe.configure({ mode: 'serial' });

test('customer books, admin cancels, customer sees the cancellation', async ({ browser, request }) => {
    // Unique email so the booking row can be found reliably on the dashboard
    const customerEmail = `system-${Date.now()}@example.com`;

    // Separate browser contexts = separate sessions, like two real users
    const customerContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const customer = await customerContext.newPage();
    const admin = await adminContext.newPage();
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

        const row = bookingRow(admin, customerEmail);

        await test.step('admin finds the booking on the dashboard', async () => {
            await signIn(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
            await expect(admin).toHaveURL(DASHBOARD_URL);
            await showAllDates(admin);

            await expect(row).toBeVisible();
            await expect(row).toContainText('System Test');
        });

        await test.step('admin cancels the booking', async () => {
            await cancelBookingButtons(row).click();
            await expect(admin.getByRole('heading', { name: 'Cancel reservation' })).toBeVisible();
            await admin.getByRole('button', { name: 'Yes' }).click();

            await expect(admin).toHaveURL(DASHBOARD_URL);
            await showAllDates(admin);
            await expect(row.getByText('Cancelled', { exact: true })).toBeVisible();
            await expect(cancelBookingButtons(row)).toHaveCount(0);
        });

        await test.step('customer sees the booking is cancelled', async () => {
            await customer.goto(`/reserve/${editToken}`);
            await expect(customer.getByRole('heading', { name: 'Reservation cancelled' })).toBeVisible();
            await expect(customer.getByRole('button', { name: 'Cancel Reservation' })).toHaveCount(0);
        });
    } finally {
        // Cleanup in case the test failed before the admin cancelled
        if (editToken) await cancelReservationViaApi(request, editToken);
        await adminContext.close();
        await customerContext.close();
    }
});