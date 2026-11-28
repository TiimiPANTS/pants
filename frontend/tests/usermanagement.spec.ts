import { test, expect } from '@playwright/test';
import { ADMIN_USER, mockJson } from './helpers/mockApi.ts';

const OWNER_USER = { id: 2, username: 'owner', email: 'owner@test.com', roleId: 2 };
const EMPLOYEE_USER = { id: 3, username: 'employee', email: 'employee@test.com', roleId: 3 };
const ALL_USERS = [ADMIN_USER, OWNER_USER, EMPLOYEE_USER];

const API = {
    currentUser: '**/api/users/me',
    users: '**/api/users',
    reservations: '**/api/reservations',
};

const PAGE_URL = '/owner/usermanagement';

test.beforeEach(async ({ page }) => {
    await mockJson(page, API.users, ALL_USERS);
});

test.describe('User management page', () => {
    test('admin sees every user with their role', async ({ page }) => {
        await mockJson(page, API.currentUser, ADMIN_USER);
        await page.goto(PAGE_URL);

        await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
        await expect(page.getByText('3 staff accounts')).toBeVisible();

        const rows = page.getByRole('row');
        await expect(rows.filter({ hasText: 'admin@test.com' })).toContainText('Admin');
        await expect(rows.filter({ hasText: 'owner@test.com' })).toContainText('Owner');
        await expect(rows.filter({ hasText: 'employee@test.com' })).toContainText('Employee');
    });

    test('owner does not see admin accounts', async ({ page }) => {
        await mockJson(page, API.currentUser, OWNER_USER);
        await page.goto(PAGE_URL);

        await expect(page.getByText('2 staff accounts')).toBeVisible();
        await expect(page.getByRole('row').filter({ hasText: 'admin@test.com' })).toHaveCount(0);
    });

    test('marks the signed-in user', async ({ page }) => {
        await mockJson(page, API.currentUser, ADMIN_USER);
        await page.goto(PAGE_URL);

        await expect(page.getByRole('row').filter({ hasText: 'admin@test.com' })).toContainText('You');
        await expect(page.getByRole('row').filter({ hasText: 'owner@test.com' })).not.toContainText('You');
    });

    test('role filter shows only that role', async ({ page }) => {
        await mockJson(page, API.currentUser, ADMIN_USER);
        await page.goto(PAGE_URL);

        await page.getByRole('button', { name: 'Employee · 1' }).click();

        await expect(page.getByRole('button', { name: 'Employee · 1' })).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('row').filter({ hasText: '@test.com' })).toHaveCount(1);
        await expect(page.getByRole('row').filter({ hasText: 'employee@test.com' })).toBeVisible();
    });

    test('search matches username or email', async ({ page }) => {
        await mockJson(page, API.currentUser, ADMIN_USER);
        await page.goto(PAGE_URL);

        const search = page.getByRole('searchbox', { name: 'Search username or email' });

        await search.fill('OWNER@');
        await expect(page.getByRole('row').filter({ hasText: '@test.com' })).toHaveCount(1);

        await search.fill('nobody');
        await expect(page.getByText('No users match your search.')).toBeVisible();
    });

    test('employee is sent to the bookings dashboard', async ({ page }) => {
        await mockJson(page, API.currentUser, EMPLOYEE_USER);
        // The dashboard loads bookings next; without this it falls back to /login.
        await mockJson(page, API.reservations, []);
        await page.goto(PAGE_URL);

        await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('signed-out visitor is sent to login', async ({ page }) => {
        await mockJson(page, API.currentUser, { message: 'Unauthorized' }, 401);
        await page.goto(PAGE_URL);

        await expect(page).toHaveURL(/\/login$/);
    });

    test('shows an error when users cannot be loaded', async ({ page }) => {
        await mockJson(page, API.currentUser, ADMIN_USER);
        await mockJson(page, API.users, {}, 500);
        await page.goto(PAGE_URL);

        await expect(page.getByRole('alert')).toHaveText('Could not load users.');
    });

    test('add user button opens the new user form', async ({ page }) => {
        await mockJson(page, API.currentUser, ADMIN_USER);
        await page.goto(PAGE_URL);

        await page.getByRole('button', { name: 'Add user' }).click();

        await expect(page).toHaveURL(/\/owner\/adduser$/);
    });
});
