import { test, expect, type Page } from '@playwright/test';

// These tests use sample API responses so they can run without the backend or a database.
test.beforeEach(async ({ page }) => {
    // Keep the calendar date consistent with the sample availability below.
    await page.clock.setFixedTime(new Date('2026-10-17T12:00:00'));
    await page.route('**/api/reservations/availability**', async (route) => {
        await route.fulfill({
            json: [
                {
                    date: '2026-10-19',
                    startTime: '10:00',
                    availableCapacity: 10,
                },
            ],
        });
    });
});

// Open the form and wait until its available reservation times have loaded.
async function gotoReservationPage(page: Page) {
    const availabilityResponse = page.waitForResponse(
        (response) =>
            response.url().includes('/api/reservations/availability') &&
            response.ok()
    );
    await page.goto('/reserve');
    await availabilityResponse;
}

// Choose the date and time returned by the sample availability response.
async function selectReservationDate(page: Page) {
    await page
        .getByRole('button', { name: 'Monday, October 19th, 2026' })
        .click();
}

async function selectReservationTime(page: Page) {
    const timeSection = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: '3. Select Time' }) });
    const timeButton = timeSection.getByRole('button', {
        name: '10:00, capacity for 10 guests',
    });

    await expect(timeButton).toBeEnabled();
    await timeButton.click();
}

test('reservation page loads successfully', async ({ page }) => {
    await gotoReservationPage(page);

    await expect(page).toHaveURL(/\/reserve$/);
    await expect(page.locator('body')).toBeVisible();
});

test('reservation page components are visible', async ({ page }) => {
    await gotoReservationPage(page);

    await expect(page.getByRole('heading', { name: '1. Select Date' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '2. Party Size' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '3. Select Time' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '4. Contact Details' })).toBeVisible();
});

test('customer can successfully submit a reservation', async ({ page }) => {

    // Return a successful response instead of sending the request to the backend.
    await page.route('**/api/reservations', async (route) => {
        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
                reservationId: 123,
                editToken: 'test-edit-token',
                customer: {
                    id: 456,
                    firstname: 'Test',
                    lastname: 'Customer',
                    email: 'test@example.com',
                },
                datetime: '19.10.2026 10:00',
                startTime: '10:00',
                endTime: '10:30',
                partySize: 2,
                details: '',
            }),
        });
    });

    // The confirmation page requests a receipt after the reservation is created.
    await page.route('**/api/receipts/123', async (route) => {
        await route.fulfill({
            status: 200,
            body: '',
        });
    });

    await gotoReservationPage(page);
    await selectReservationDate(page);
    await selectReservationTime(page);

    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('Customer');
    await page.getByLabel('Email').fill('test@example.com');

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();

    await expect(page).toHaveURL(/\/confirmation$/);
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed!' })).toBeVisible();
    await expect(page.getByText('#PV-123')).toBeVisible();
});

test('empty reservation form displays date validation error', async ({ page }) => {

    await gotoReservationPage(page);

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();
    await expect(page.getByText('Please select a date.')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});

test('missing contact details display validation errors', async ({ page }) => {

    await gotoReservationPage(page);
    await selectReservationDate(page);
    await selectReservationTime(page);

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();
    await expect(page.getByText('First name is required.')).toBeVisible();
    await expect(page.getByText('Last name is required.')).toBeVisible();
    await expect(page.getByText('Email is required.')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});

test('invalid contact details display validation errors', async ({ page }) => {

    await gotoReservationPage(page);
    await selectReservationDate(page);
    await selectReservationTime(page);

    await page.getByLabel('First Name').fill('A');
    await page.getByLabel('Last Name').fill('A');
    await page.getByLabel('Email').fill('testexamplecom');

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();
    await expect(page.getByText('First name must be at least 2 characters.')).toBeVisible();
    await expect(page.getByText('Last name must be at least 2 characters.')).toBeVisible();
    await expect(page.getByText('Enter an email like name@example.com')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});

test('names longer than 50 characters display validation errors', async ({ page }) => {

    await gotoReservationPage(page);
    await selectReservationDate(page);
    await selectReservationTime(page);

    await page.getByLabel('First Name').fill('Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    await page.getByLabel('Last Name').fill('Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    await page.getByLabel('Email').fill('test@example.com');

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();
    await expect(page.getByText('First name must be 50 characters or less.')).toBeVisible();
    await expect(page.getByText('Last name must be 50 characters or less.')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});

test('customer can select a reservation time and party size', async ({ page }) => {

    await gotoReservationPage(page);

    await selectReservationDate(page);

    const partySection = page
        .locator('section')
        .filter({
            has: page.getByRole('heading', { name: '2. Party Size' }),
        });

    const increaseButton = partySection.getByRole('button', { name: '+' });

    for (let i = 2; i < 8; i++) {
        await increaseButton.click();
    }

    await expect(partySection.getByText('8 Guests')).toBeVisible();

    await selectReservationTime(page);

    const timeSection = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: '3. Select Time' }) });
    await expect(
        timeSection.getByRole('button', {
            name: '10:00, capacity for 10 guests',
        })
    ).toHaveClass(/border-2/);
});

test('backend error displays an error message', async ({ page }) => {

    await page.route('**/api/reservations', async (route) => {
        await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
                message: 'Something went wrong',
            }),
        });
    });

    await gotoReservationPage(page);
    await selectReservationDate(page);
    await selectReservationTime(page);

    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('Customer');
    await page.getByLabel('Email').fill('test@example.com');

    await page.getByRole('button', {
        name: 'Confirm Reservation',
    }).click();

    await expect(page.getByText('Something went wrong')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});