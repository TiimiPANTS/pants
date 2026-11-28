import { test, expect, type Page } from '@playwright/test';
import { ADMIN_USER, mockJson } from './helpers/mockApi.ts';
import {
    DASHBOARD_URL,
    bookingRow,
    cancelBookingButtons,
    cancelPageUrl,
    reservationsTable,
    showAllDates,
} from './helpers/dashboardHelpers.ts';

const RESERVATION_ID = 123;
const GUEST_NAME = 'Test Customer';

const confirmedReservation = {
    reservationId: RESERVATION_ID,
    customer: {
        firstname: 'Test',
        lastname: 'Customer',
        email: 'test@example.com',
    },
    startTime: '10:00',
    endTime: '10:30',
    datetime: '19.12.2026 10:00',
    partySize: 2,
    details: '',
    status: { name: 'CONFIRMED' },
};

const cancelledReservation = {
    ...confirmedReservation,
    status: { name: 'CANCELLED' },
};

const API = {
    reservations: '**/api/reservations',
    reservation: `**/api/reservations/${RESERVATION_ID}`,
    cancel: `**/api/reservations/${RESERVATION_ID}/cancel`,
    currentUser: '**/api/users/me',
};

test.beforeEach(async ({ page }) => {
    await mockJson(page, API.reservations, [confirmedReservation]);
    await mockJson(page, API.reservation, confirmedReservation);
    await mockJson(page, API.currentUser, ADMIN_USER);
});

async function openDashboard(page: Page) {
    const reservationsLoaded = page.waitForResponse(
        (response) => response.url().endsWith('/api/reservations') && response.ok()
    );

    await page.goto('/dashboard');
    await reservationsLoaded;
    await showAllDates(page);
}

async function openCancelPage(page: Page) {
    await openDashboard(page);
    await cancelBookingButtons(page).click();
    await expect(page).toHaveURL(cancelPageUrl(RESERVATION_ID));
}

test.describe('Owner dashboard', () => {
    test('lists reservations', async ({ page }) => {
        await openDashboard(page);

        await expect(page).toHaveURL(DASHBOARD_URL);

        const table = reservationsTable(page);
        await expect(table.getByText(GUEST_NAME)).toBeVisible();
        await expect(table.getByText(confirmedReservation.customer.email)).toBeVisible();
    });

    test('shows a cancelled reservation without a Cancel action', async ({ page }) => {
        await mockJson(page, API.reservations, [cancelledReservation]);

        await openDashboard(page);

        const row = bookingRow(page, GUEST_NAME);
        await expect(row.getByText('Cancelled', { exact: true })).toBeVisible();
        await expect(cancelBookingButtons(page)).toHaveCount(0);
    });
});

test.describe('Owner cancels a reservation', () => {
    test('cancel page shows the reservation and asks for confirmation', async ({ page }) => {
        await openCancelPage(page);

        await expect(page.getByRole('heading', { name: 'Cancel reservation' })).toBeVisible();
        await expect(page.getByText(`#${RESERVATION_ID}`)).toBeVisible();
        await expect(page.getByText(GUEST_NAME)).toBeVisible();
        await expect(page.getByText('Are you sure you want to cancel this reservation?')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'No' })).toBeVisible();
    });

    test('choosing No returns to the dashboard', async ({ page }) => {
        await openCancelPage(page);

        await page.getByRole('button', { name: 'No' }).click();

        await expect(page).toHaveURL(DASHBOARD_URL);
    });

    test('choosing Yes cancels and returns to the dashboard', async ({ page }) => {
        await mockJson(page, API.cancel, { message: 'Reservation cancelled successfully' });

        await openCancelPage(page);
        await page.getByRole('button', { name: 'Yes' }).click();

        await expect(page).toHaveURL(DASHBOARD_URL);
    });

    test('an already cancelled reservation shows a notice instead of the confirmation', async ({ page }) => {
        await mockJson(page, API.reservation, cancelledReservation);

        await openCancelPage(page);

        await expect(page.getByText('This reservation is already cancelled.')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Yes' })).toHaveCount(0);
    });

    test('a server error is shown and the owner stays on the cancel page', async ({ page }) => {
        await mockJson(page, API.cancel, { message: 'Unable to cancel reservation.' }, 500);

        await openCancelPage(page);
        await page.getByRole('button', { name: 'Yes' }).click();

        await expect(page.getByText('Unable to cancel reservation.')).toBeVisible();
        await expect(page).toHaveURL(cancelPageUrl(RESERVATION_ID));
    });
});
