import { test, expect, type Page } from '@playwright/test';

const token = 'test-edit-token';

const sampleReservation = {
    reservationId: 123,
    editToken: token,
    customer: {
        id: 1,
        firstname: 'Test',
        lastname: 'Customer',
        email: 'test@example.com',
    },
    startTime: '10:00',
    endTime: '12:00',
    datetime: '19.12.2026 10:00',
    partySize: 2,
    details: 'Window seat, please',
    status: { name: 'CONFIRMED' },
};

const availabilityResponse: {
    date: string;
    startTime: string;
    availableCapacity: number;
}[] = [];

async function gotoManageReservation(page: Page) {
    await page.goto(`/reserve/${token}`);
    await expect(
        page.getByRole('heading', { name: 'Edit your reservation' })
    ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-12-17T12:00:00'));

    await page.route('**/api/reservations/availability**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(availabilityResponse),
        });
    });

    await page.route(`**/api/reservations/manage/${token}`, async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(sampleReservation),
            });
        } else {
            await route.continue();
        }
    });
});

test('customer can open reservation using edit token', async ({ page }) => {
    await gotoManageReservation(page);

    await expect(page.getByLabel('First name')).toHaveValue('Test');
    await expect(page.getByLabel('Last name')).toHaveValue('Customer');
    await expect(page.getByLabel('Email')).toHaveValue('test@example.com');

    await expect(
        page.getByRole('button', { name: 'Cancel Reservation' })
    ).toBeVisible();
});

test('customer can successfully cancel reservation', async ({ page }) => {
    await page.route(
        `**/api/reservations/manage/${token}/cancel`,
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Reservation cancelled' }),
            });
        }
    );

    await gotoManageReservation(page);

    page.on('dialog', async (dialog) => {
        expect(dialog.message()).toBe(
            'Are you sure you want to cancel this reservation?'
        );
        await dialog.accept();
    });

    await page.getByRole('button', { name: 'Cancel Reservation' }).click();

    await expect(
        page.getByRole('heading', { name: 'Reservation cancelled' })
    ).toBeVisible();
});

test('customer can decline cancellation', async ({ page }) => {
    await gotoManageReservation(page);

    page.on('dialog', async (dialog) => {
        await dialog.dismiss();
    });

    await page.getByRole('button', { name: 'Cancel Reservation' }).click();

    await expect(
        page.getByRole('heading', { name: 'Edit your reservation' })
    ).toBeVisible();

    await expect(
        page.getByRole('button', { name: 'Cancel Reservation' })
    ).toBeEnabled();
});

test('already cancelled reservation displays cancellation confirmation', async ({ page }) => {
    await page.unroute(`**/api/reservations/manage/${token}`);

    await page.route(`**/api/reservations/manage/${token}`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                ...sampleReservation,
                status: { name: 'CANCELLED' },
            }),
        });
    });

    await page.goto(`/reserve/${token}`);

    await expect(
        page.getByRole('heading', { name: 'Reservation cancelled' })
    ).toBeVisible();

    await expect(
        page.getByRole('button', { name: 'Cancel Reservation' })
    ).toHaveCount(0);
});

test('invalid edit token displays an error', async ({ page }) => {
    await page.unroute(`**/api/reservations/manage/${token}`);

    await page.route(`**/api/reservations/manage/${token}`, async (route) => {
        await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Reservation not found.' }),
        });
    });

    await page.goto(`/reserve/${token}`);

    await expect(
        page.getByText('Reservation not found.')
    ).toBeVisible();
});

test('customer sees an error when cancellation fails', async ({ page }) => {
    await page.route(
        `**/api/reservations/manage/${token}/cancel`,
        async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'Unable to cancel reservation.',
                }),
            });
        }
    );

    await gotoManageReservation(page);

    page.on('dialog', async (dialog) => {
        await dialog.accept();
    });

    await page.getByRole('button', { name: 'Cancel Reservation' }).click();

    await expect(
        page.getByText('Unable to cancel reservation.')
    ).toBeVisible();

    await expect(
        page.getByRole('button', { name: 'Cancel Reservation' })
    ).toBeEnabled();
});