import { test, expect } from '@playwright/test';
import { ADMIN_USER, mockJson } from './helpers/mockApi.ts';
import { DASHBOARD_URL, signIn } from './helpers/dashboardHelpers.ts';

const LOGIN_URL = /\/login$/;
const TEST_TOKEN = 'playwright-test-token';
const EMAIL = 'testadmin@test.com';
const PASSWORD = 'test123';

const API = {
    login: '**/api/auth/login',
    currentUser: '**/api/users/me',
    reservations: '**/api/reservations',
};

test.beforeEach(async ({ page }) => {
    await mockJson(page, API.login, {
        message: 'Login successful',
        email: ADMIN_USER.email,
        role: 'ADMIN',
        token: TEST_TOKEN,
    });
    await mockJson(page, API.currentUser, ADMIN_USER);

    // Only answers with data when the request carries the token from the login response
    await page.route(API.reservations, async (route) => {
        const authorized = (await route.request().headerValue('authorization')) === `Bearer ${TEST_TOKEN}`;
        await route.fulfill({
            status: authorized ? 200 : 401,
            contentType: 'application/json',
            body: JSON.stringify(authorized ? [] : { message: 'Unauthorized' }),
        });
    });
});

test.describe('Login page', () => {
    test('shows the sign-in form', async ({ page }) => {
        await page.goto('/login');

        await expect(page).toHaveURL(LOGIN_URL);
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Back to home page' })).toBeVisible();
    });

    test('valid credentials open the dashboard and store the token', async ({ page }) => {
        await signIn(page, EMAIL, PASSWORD);

        await expect(page).toHaveURL(DASHBOARD_URL);
        expect(await page.evaluate(() => sessionStorage.getItem('jwt'))).toBe(TEST_TOKEN);

        // Dashboard loaded with the token (otherwise the reservations mock returns 401)
        await expect(page.getByRole('group', { name: 'Filter bookings' })).toBeVisible();
        await expect(page.getByText(/^No bookings on /)).toBeVisible();
    });
});

test.describe('Login validation', () => {
    test('empty form shows required field errors', async ({ page }) => {
        await page.goto('/login');
        await page.getByRole('button', { name: 'Sign in' }).click();

        await expect(page.getByText('Email is required.')).toBeVisible();
        await expect(page.getByText('Password is required.')).toBeVisible();
        await expect(page).toHaveURL(LOGIN_URL);
    });

    test('malformed email shows a format error', async ({ page }) => {
        await signIn(page, 'invalid-email', PASSWORD);

        await expect(page.getByText('Enter an email like name@example.com')).toBeVisible();
        await expect(page).toHaveURL(LOGIN_URL);
    });

    test('wrong credentials show the server error', async ({ page }) => {
        await mockJson(page, API.login, { message: 'Invalid email or password' }, 401);

        await signIn(page, EMAIL, PASSWORD);

        await expect(page.getByRole('alert')).toHaveText('Invalid email or password');
        await expect(page).toHaveURL(LOGIN_URL);
    });
});
