import { test, expect } from '@playwright/test';
import { mockJson } from './helpers/mockApi.ts';

const LOGIN_URL = /\/login$/;
const TEST_TOKEN = 'playwright-test-token';

const TEST_USER = {
    id: 1,
    username: 'testuser',
    email: 'testuser@test.com',
};

const UPDATED_USER = {
    id: 1,
    username: 'updateduser',
    email: 'updated@test.com',
};

const API = {
    currentUser: '**/api/users/me',
    updateUser: '**/api/users/1',
    changePassword: '**/api/users/me/password',
    logout: '**/api/auth/logout',
};

test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
        sessionStorage.setItem('jwt', token);
    }, TEST_TOKEN);

    await mockJson(page, API.currentUser, TEST_USER);
});

test.describe('Edit User page', () => {
    test('shows the account information form', async ({ page }) => {
        await page.goto('/edituser');

        await expect(page.getByRole('heading', { name: 'My Account' })).toBeVisible();

        await expect(page.getByText('Manage your personal information and account settings')).toBeVisible();

        await expect(page.getByLabel('Username')).toHaveValue(TEST_USER.username);
        await expect(page.getByLabel('Email address')).toHaveValue(TEST_USER.email);

        await expect(page.getByRole('button', { name: 'Bookings' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
    });

    test('redirects to login when user is unauthorized', async ({ page }) => {
        await mockJson(page, API.currentUser, { message: 'Unauthorized' }, 401);

        await page.goto('/edituser');

        await expect(page).toHaveURL(LOGIN_URL);
    });

    test('redirects to login when user is forbidden', async ({ page }) => {
        await mockJson(page, API.currentUser, { message: 'Forbidden' }, 403);

        await page.goto('/edituser');

        await expect(page).toHaveURL(LOGIN_URL);
    });

    test('bookings link navigates to dashboard', async ({ page }) => {
        await page.goto('/edituser');

        await page.getByRole('button', { name: 'Bookings' }).click();

        await expect(page).toHaveURL(/\/dashboard$/);
    });

    test('logout redirects to login', async ({ page }) => {
        await mockJson(page, API.logout, { message: 'Logged out successfully' });

        await page.goto('/edituser');

        await page.getByRole('button', { name: 'Log out' }).click();

        await expect(page).toHaveURL(LOGIN_URL);
    });
});

test.describe('Personal information', () => {
    test('updates username and email successfully', async ({ page }) => {
        await mockJson(page, API.updateUser, UPDATED_USER);

        await page.goto('/edituser');

        await page.getByLabel('Username').fill(UPDATED_USER.username);
        await page.getByLabel('Email address').fill(UPDATED_USER.email);

        await page.getByRole('button', { name: /save/i }).click();

        await expect(
            page.getByText('Account information updated successfully')
        ).toBeVisible();

        await expect(page.getByLabel('Username')).toHaveValue(UPDATED_USER.username);
        await expect(page.getByLabel('Email address')).toHaveValue(UPDATED_USER.email);
    });

    test('shows server error when updating user fails', async ({ page }) => {
        await mockJson(
            page,
            API.updateUser,
            { message: 'Email is already in use' },
            409
        );

        await page.goto('/edituser');

        await page.getByLabel('Username').fill(UPDATED_USER.username);
        await page.getByLabel('Email').fill(UPDATED_USER.email);

        await page.getByRole('button', { name: /save/i }).click();

        await expect(page.getByText('Email is already in use')).toBeVisible();
    });

    test('shows default error when server returns an error without a message', async ({ page }) => {
        await page.route(API.updateUser, async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({}),
            });
        });

        await page.goto('/edituser');

        await page.getByLabel('Username').fill(UPDATED_USER.username);
        await page.getByLabel('Email').fill(UPDATED_USER.email);

        await page.getByRole('button', { name: /save/i }).click();

        await expect(
            page.getByText('Could not update account information.')
        ).toBeVisible();
    });
});

test.describe('Personal information validation', () => {
    test('empty username and invalid email are caught before sending', async ({ page }) => {
        await page.goto('/edituser');

        await page.getByLabel('Username').fill('   ');
        await page.getByLabel('Email address').fill('not-an-email');

        await page.getByRole('button', { name: /save/i }).click();

        await expect(page.getByText('Enter a username.')).toBeVisible();
        await expect(page.getByText(/Enter a valid email address/)).toBeVisible();
    });

    test('changing email stores the new sign-in token', async ({ page }) => {
        await mockJson(page, API.updateUser, { ...UPDATED_USER, token: 'new-token' });

        await page.goto('/edituser');

        await page.getByLabel('Email address').fill(UPDATED_USER.email);
        await page.getByRole('button', { name: /save/i }).click();

        await expect(page.getByText('Account information updated successfully')).toBeVisible();
        expect(await page.evaluate(() => sessionStorage.getItem('jwt'))).toBe('new-token');
    });
});

test.describe('Change password', () => {
    test('shows the password form', async ({ page }) => {
        await page.goto('/edituser');

        await expect(page.getByLabel('Current password')).toBeVisible();
        await expect(page.getByLabel('New password', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Confirm new password')).toBeVisible();

    });

    test('empty password fields show validation error', async ({ page }) => {
        await page.goto('/edituser');

        await page.getByRole('button', { name: 'Update password' }).click();

        await expect(page.getByText('Enter your current password.')).toBeVisible();
        await expect(page.getByText('Enter a new password.')).toBeVisible();
        await expect(page.getByText('Enter the new password again.')).toBeVisible();
        await expect(page.getByLabel('Current password')).toHaveAttribute('aria-invalid', 'true');
    });

    test('too short new password is caught before sending', async ({ page }) => {
        let requested = false;
        await page.route(API.changePassword, (route) => {
            requested = true;
            return route.fulfill({ status: 200, body: '{}' });
        });

        await page.goto('/edituser');

        await page.getByLabel('Current password').fill('oldPassword123');
        await page.getByLabel('New password', { exact: true }).fill('ab');
        await page.getByLabel('Confirm new password').fill('ab');

        await page.getByRole('button', { name: 'Update password' }).click();

        await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
        expect(requested).toBe(false);
    });

    test('typing in a field clears its error', async ({ page }) => {
        await page.goto('/edituser');

        await page.getByRole('button', { name: 'Update password' }).click();
        await expect(page.getByText('Enter your current password.')).toBeVisible();

        await page.getByLabel('Current password').fill('x');

        await expect(page.getByText('Enter your current password.')).toHaveCount(0);
    });

    test('different passwords show validation error', async ({ page }) => {
        await page.goto('/edituser');

        await page.getByLabel('Current password').fill('oldPassword123');
        await page.getByLabel('New password', { exact: true }).fill('newPassword123');
        await page.getByLabel('Confirm new password').fill('differentPassword123');

        await page.getByRole('button', { name: /update password/i }).click();

        await expect(
            page.getByText('New passwords do not match.')
        ).toBeVisible();
    });

    test('same current and new password show validation error', async ({ page }) => {
        await page.goto('/edituser');

        await page.getByLabel('Current password').fill('password123');
        await page.getByLabel('New password', { exact: true }).fill('password123');
        await page.getByLabel('Confirm new password').fill('password123');

        await page.getByRole('button', { name: /update password/i }).click();

        await expect(
            page.getByText('New password must be different from current password.')
        ).toBeVisible();
    });

    test('changes password successfully', async ({ page }) => {
        await mockJson(page, API.changePassword, {
            message: 'Password updated successfully',
        });

        await page.goto('/edituser');

        await page.getByLabel('Current password').fill('oldPassword123');
        await page.getByLabel('New password', { exact: true }).fill('newPassword123');
        await page.getByLabel('Confirm new password').fill('newPassword123');

        await page.getByRole('button', { name: /update password/i }).click();

        await expect(
            page.getByText('Password updated successfully!')
        ).toBeVisible();

        await expect(page.getByLabel('Current password')).toHaveValue('');
        await expect(page.getByLabel('New password', { exact: true })).toHaveValue('');
        await expect(page.getByLabel('Confirm new password')).toHaveValue('');
    });

    test('shows server error when password change fails', async ({ page }) => {
        await mockJson(
            page,
            API.changePassword,
            { message: 'Current password is incorrect' },
            400
        );

        await page.goto('/edituser');

        await page.getByLabel('Current password').fill('wrongPassword123');
        await page.getByLabel('New password', { exact: true }).fill('newPassword123');
        await page.getByLabel('Confirm new password').fill('newPassword123');

        await page.getByRole('button', { name: /update password/i }).click();

        await expect(
            page.getByText('Current password is incorrect')
        ).toBeVisible();
    });
});