import { test, expect } from '@playwright/test';

test('reservation page loads successfully', async ({ page }) => {

    await page.goto('/reserve');

    await expect(page).toHaveURL(/\/reserve$/);
    await expect(page.locator('body')).toBeVisible();
});

test('reservation page components are visible', async ({ page }) => {

    await page.goto('/reserve');

    await expect(page.getByRole('heading', { name: '1. Select Date' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '2. Party Size' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '3. Select Time' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '4. Contact Details' })).toBeVisible();
});

test('customer can successfully submit a reservation', async ({ page }) => {

    await page.route('**/api/reservations', async (route) => {
        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
                reservationId: 123,
                editToken: 'test-edit-token',
            }),
        });
    });

    await page.route('**/api/receipts/123', async (route) => {
        await route.fulfill({
            status: 200,
            body: '',
        });
    });

    await page.goto('/reserve');

    const dateSection = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: '1. Select Date' }), });

    const dateButton = dateSection
        .locator('button')
        .filter({ hasText: /^\d+$/ })
        .and(dateSection.locator('button:not([disabled])'))
        .first();

    await dateButton.click();

    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('Customer');
    await page.getByLabel('Email').fill('test@example.com');

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();

    await expect(page).toHaveURL(/\/confirmation$/);
});

test('empty reservation form displays date validation error', async ({ page }) => {

    await page.goto('/reserve');

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();
    await expect(page.getByText('Please select a date.')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});

test('only date selected displays contact details errors', async ({ page }) => {

    await page.goto('/reserve');

    const dateSection = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: '1. Select Date' }), });

    const dateButton = dateSection
        .locator('button')
        .filter({ hasText: /^\d+$/ })
        .and(dateSection.locator('button:not([disabled])'))
        .first();

    await dateButton.click();

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();
    await expect(page.getByText('First name is required.')).toBeVisible();
    await expect(page.getByText('Last name is required.')).toBeVisible();
    await expect(page.getByText('Email is required.')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});

test('invalid contact details display validation errors', async ({ page }) => {

    await page.goto('/reserve');

    const dateSection = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: '1. Select Date' }), });

    const dateButton = dateSection
        .locator('button')
        .filter({ hasText: /^\d+$/ })
        .and(dateSection.locator('button:not([disabled])'))
        .first();

    await dateButton.click();

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

    await page.goto('/reserve');

    const dateSection = page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: '1. Select Date' }), });

    const dateButton = dateSection
        .locator('button')
        .filter({ hasText: /^\d+$/ })
        .and(dateSection.locator('button:not([disabled])'))
        .first();

    await dateButton.click();

    await page.getByLabel('First Name').fill('Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    await page.getByLabel('Last Name').fill('Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    await page.getByLabel('Email').fill('test@example.com');

    await page.getByRole('button', { name: 'Confirm Reservation', }).click();
    await expect(page.getByText('First name must be 50 characters or less.')).toBeVisible();
    await expect(page.getByText('Last name must be 50 characters or less.')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});

test('customer can select a reservation time and party size', async ({ page }) => {

    await page.goto('/reserve');

    const dateSection = page
        .locator('section')
        .filter({
            has: page.getByRole('heading', { name: '1. Select Date' }),
        });

    const dateButton = dateSection
        .locator('button')
        .filter({ hasText: /^\d+$/ })
        .and(dateSection.locator('button:not([disabled])'))
        .first();

    await dateButton.click();

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

    const timeSection = page
        .locator('section')
        .filter({
            has: page.getByRole('heading', { name: '3. Select Time' }),
        });

    const firstAvailableTime = timeSection
        .getByRole('button')
        .filter({ hasText: /^\d{2}:\d{2}$/ })
        .and(timeSection.locator('button:not([disabled])'))
        .first();

    await firstAvailableTime.click();

    await expect(firstAvailableTime).toHaveClass(/border-2/);
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

    await page.goto('/reserve');

    const dateSection = page
        .locator('section')
        .filter({
            has: page.getByRole('heading', { name: '1. Select Date' }),
        });

    const dateButton = dateSection
        .locator('button')
        .filter({ hasText: /^\d+$/ })
        .and(dateSection.locator('button:not([disabled])'))
        .first();

    await dateButton.click();

    await page.getByLabel('First Name').fill('Test');
    await page.getByLabel('Last Name').fill('Customer');
    await page.getByLabel('Email').fill('test@example.com');

    await page.getByRole('button', {
        name: 'Confirm Reservation',
    }).click();

    await expect(page.getByText('Something went wrong')).toBeVisible();

    await expect(page).toHaveURL(/\/reserve$/);
});