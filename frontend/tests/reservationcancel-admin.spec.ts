import { test, expect, type Page } from '@playwright/test';

const sampleReservation = {
    reservationId: 123,
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
    status: {
        name: 'CONFIRMED',
    },
};

test.beforeEach(async ({ page }) => {

    await page.route('**/api/reservations', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([sampleReservation]),
        });
    });

    await page.route('**/api/reservations/123', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(sampleReservation),
        });
    });

    await page.route('**/api/auth/csrf', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                headerName: 'X-CSRF-TOKEN',
                token: 'test-csrf-token',
            }),
        });
    });
});

async function gotoDashboard(page: Page) {
    const reservationsResponse = page.waitForResponse(
        (response) =>
            response.url().includes('/api/reservations') &&
            !response.url().includes('/api/reservations/123') &&
            response.ok()
    );

    await page.goto('/owner/dashboard');
    await reservationsResponse;
}

async function gotoCancellationPage(page: Page) {
    await gotoDashboard(page);

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(
        /\/owner\/reservations\/123\/cancel$/
    );
}

test('owner dashboard loads reservations successfully', async ({ page }) => {
    await gotoDashboard(page);

    await expect(page).toHaveURL(/\/owner\/dashboard$/);

    await expect(
        page.getByRole('heading', { name: 'Reservations' })
    ).toBeVisible();

    await expect(page.getByText('#123')).toBeVisible();
    await expect(page.getByText('Test Customer')).toBeVisible();
});

test('owner can open reservation cancellation page', async ({ page }) => {
    await gotoCancellationPage(page);

    await expect(
        page.getByRole('heading', { name: 'Cancel reservation' })
    ).toBeVisible();

    await expect(page.getByText('#123')).toBeVisible();
    await expect(page.getByText('Test Customer')).toBeVisible();

    await expect(
        page.getByText('Are you sure you want to cancel this reservation?')
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'No' })).toBeVisible();
});

test('owner can go back without cancelling reservation', async ({ page }) => {
    await gotoCancellationPage(page);

    await page.getByRole('button', { name: 'No' }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard$/);
});

test('owner can successfully cancel a reservation', async ({ page }) => {

    await page.route('**/api/reservations/123/cancel', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                message: 'Reservation cancelled successfully',
            }),
        });
    });

    await gotoCancellationPage(page);

    await page.getByRole('button', { name: 'Yes' }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard$/);
});

test('cancelled reservation displays Cancelled instead of Cancel', async ({ page }) => {

    await page.unroute('**/api/reservations');

    await page.route('**/api/reservations', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    ...sampleReservation,
                    status: {
                        name: 'CANCELLED',
                    },
                },
            ]),
        });
    });

    await gotoDashboard(page);

    await expect(page.getByText('Cancelled')).toBeVisible();

    await expect(
        page.getByRole('button', { name: 'Cancel' })
    ).toHaveCount(0);
});

test('already cancelled reservation displays an information message', async ({ page }) => {

    await page.unroute('**/api/reservations/123');

    await page.route('**/api/reservations/123', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                ...sampleReservation,
                status: {
                    name: 'CANCELLED',
                },
            }),
        });
    });

    await gotoDashboard(page);

    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(
        page.getByText('This reservation is already cancelled.')
    ).toBeVisible();

    await expect(
        page.getByRole('button', { name: 'Yes' })
    ).toHaveCount(0);
});

test('cancellation error displays an error message', async ({ page }) => {

    await page.route('**/api/reservations/123/cancel', async (route) => {
        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
                message: 'Unable to cancel reservation.',
            }),
        });
    });

    await gotoCancellationPage(page);

    await page.getByRole('button', { name: 'Yes' }).click();

    await expect(
        page.getByText('Unable to cancel reservation.')
    ).toBeVisible();

    await expect(page).toHaveURL(
        /\/owner\/reservations\/123\/cancel$/
    );
});