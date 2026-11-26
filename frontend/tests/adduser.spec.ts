import { test, expect } from '@playwright/test';
import { ADMIN_USER, mockJson } from './helpers/mockApi.ts';

const LOGIN_URL = /\/login$/;
const DASHBOARD_URL = /\/dashboard$/;
const TEST_TOKEN = 'playwright-test-token';

const OWNER_USER = {
    id: 2,
    username: 'owner',
    email: 'owner@test.com',
    roleId: 2,
};

const EMPLOYEE_USER = {
    id: 3,
    username: 'employee',
    email: 'employee@test.com',
    roleId: 3,
};

const NEW_USER = {
    username: 'newuser',
    email: 'newuser@test.com',
    password: 'password123',
    roleId: 2,
};

const API = {
    currentUser: '**/api/users/me',
    createUser: '**/api/users',
    csrf: '**/api/auth/csrf',
    logout: '**/api/auth/logout',
};

test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
        sessionStorage.setItem('jwt', token);
    }, TEST_TOKEN);

    await mockJson(page, API.currentUser, ADMIN_USER);

    await mockJson(page, API.csrf, {
        headerName: 'X-XSRF-TOKEN',
        token: 'test-csrf-token',
    });
});

test.describe('Add User page', () => {
    test('shows the add user form', async ({ page }) => {
        await page.goto('/owner/adduser');

        await expect(
            page.getByRole('heading', { name: 'New user' })
        ).toBeVisible();

        await expect(
            page.getByText('Create a new user account')
        ).toBeVisible();

        await expect(
            page.getByRole('heading', { name: 'User information' })
        ).toBeVisible();

        await expect(page.getByLabel('Username')).toBeVisible();
        await expect(page.getByLabel('Email address')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByLabel('Role')).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'Create user' })
        ).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'Cancel' })
        ).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'Dashboard' })
        ).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'Log out' })
        ).toBeVisible();
    });

    test('redirects to login when user is unauthorized', async ({ page }) => {
        await mockJson(
            page,
            API.currentUser,
            { message: 'Unauthorized' },
            401
        );

        await page.goto('/owner/adduser');

        await expect(page).toHaveURL(LOGIN_URL);
    });

    test('redirects to login when user is forbidden', async ({ page }) => {
        await mockJson(
            page,
            API.currentUser,
            { message: 'Forbidden' },
            403
        );

        await page.goto('/owner/adduser');

        await expect(page).toHaveURL(LOGIN_URL);
    });

    test('redirects employee to login', async ({ page }) => {
        await mockJson(page, API.currentUser, EMPLOYEE_USER);

        await page.goto('/owner/adduser');

        await expect(page).toHaveURL(LOGIN_URL);
    });

    test('allows admin to access add user page', async ({ page }) => {
        await mockJson(page, API.currentUser, ADMIN_USER);

        await page.goto('/owner/adduser');

        await expect(page).toHaveURL(/\/adduser$/);

        await expect(
            page.getByRole('heading', { name: 'New user' })
        ).toBeVisible();
    });

    test('allows owner to access add user page', async ({ page }) => {
        await mockJson(page, API.currentUser, OWNER_USER);

        await page.goto('/owner/adduser');

        await expect(page).toHaveURL(/\/adduser$/);

        await expect(
            page.getByRole('heading', { name: 'New user' })
        ).toBeVisible();
    });

    test('dashboard button navigates to dashboard', async ({ page }) => {
        await page.goto('/owner/adduser');

        await page.getByRole('button', { name: 'Dashboard' }).click();

        await expect(page).toHaveURL(DASHBOARD_URL);
    });

    test('cancel button navigates to user management', async ({ page }) => {
        await page.goto('/owner/adduser');

        await page.getByRole('button', { name: 'Cancel' }).click();

        await expect(page).toHaveURL(/\/owner\/usermanagement$/);
    });

    test('logout redirects to login', async ({ page }) => {
        await mockJson(
            page,
            API.logout,
            { message: 'Logged out successfully' }
        );

        await page.goto('/owner/adduser');

        await page.getByRole('button', { name: 'Log out' }).click();

        await expect(page).toHaveURL(LOGIN_URL);
    });
});

test.describe('User information form', () => {
    test('admin can select all roles', async ({ page }) => {
        await page.goto('/owner/adduser');

        const roleSelect = page.getByLabel('Role');

        await expect(
            roleSelect.locator('option', { hasText: 'Admin' })
        ).toHaveCount(1);

        await expect(
            roleSelect.locator('option', { hasText: 'Owner' })
        ).toHaveCount(1);

        await expect(
            roleSelect.locator('option', { hasText: 'Employee' })
        ).toHaveCount(1);
    });

    test('owner cannot select admin role', async ({ page }) => {
        await mockJson(page, API.currentUser, OWNER_USER);

        await page.goto('/owner/adduser');

        const roleSelect = page.getByLabel('Role');

        await expect(
            roleSelect.locator('option', { hasText: 'Admin' })
        ).toHaveCount(0);

        await expect(
            roleSelect.locator('option', { hasText: 'Owner' })
        ).toHaveCount(1);

        await expect(
            roleSelect.locator('option', { hasText: 'Employee' })
        ).toHaveCount(1);
    });

    test('form fields accept user input', async ({ page }) => {
        await page.goto('/owner/adduser');

        await page.getByLabel('Username').fill(NEW_USER.username);
        await page.getByLabel('Email address').fill(NEW_USER.email);
        await page.getByLabel('Password').fill(NEW_USER.password);
        await page.getByLabel('Role').selectOption('2');

        await expect(
            page.getByLabel('Username')
        ).toHaveValue(NEW_USER.username);

        await expect(
            page.getByLabel('Email address')
        ).toHaveValue(NEW_USER.email);

        await expect(
            page.getByLabel('Password')
        ).toHaveValue(NEW_USER.password);

        await expect(
            page.getByLabel('Role')
        ).toHaveValue('2');
    });

    test('empty fields show validation error', async ({ page }) => {
        await page.goto('/owner/adduser');

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect(
            page.getByText('Please fill in all fields.')
        ).toBeVisible();
    });

    test('missing username shows validation error', async ({ page }) => {
        await page.goto('/owner/adduser');

        await page.getByLabel('Email address').fill(NEW_USER.email);
        await page.getByLabel('Password').fill(NEW_USER.password);
        await page.getByLabel('Role').selectOption('2');

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect(
            page.getByText('Please fill in all fields.')
        ).toBeVisible();
    });

    test('missing email shows validation error', async ({ page }) => {
        await page.goto('/owner/adduser');

        await page.getByLabel('Username').fill(NEW_USER.username);
        await page.getByLabel('Password').fill(NEW_USER.password);
        await page.getByLabel('Role').selectOption('2');

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect(
            page.getByText('Please fill in all fields.')
        ).toBeVisible();
    });

    test('missing password shows validation error', async ({ page }) => {
        await page.goto('/owner/adduser');

        await page.getByLabel('Username').fill(NEW_USER.username);
        await page.getByLabel('Email address').fill(NEW_USER.email);
        await page.getByLabel('Role').selectOption('2');

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect(
            page.getByText('Please fill in all fields.')
        ).toBeVisible();
    });

    test('missing role shows validation error', async ({ page }) => {
        await page.goto('/owner/adduser');

        await page.getByLabel('Username').fill(NEW_USER.username);
        await page.getByLabel('Email address').fill(NEW_USER.email);
        await page.getByLabel('Password').fill(NEW_USER.password);

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect(
            page.getByText('Please fill in all fields.')
        ).toBeVisible();
    });
});

test.describe('Create user', () => {
    test('creates user successfully', async ({ page }) => {
        await mockJson(page, API.createUser, {
            id: 4,
            username: NEW_USER.username,
            email: NEW_USER.email,
            roleId: NEW_USER.roleId,
        });

        await page.goto('/owner/adduser');

        await page.getByLabel('Username').fill(NEW_USER.username);
        await page.getByLabel('Email address').fill(NEW_USER.email);
        await page.getByLabel('Password').fill(NEW_USER.password);
        await page.getByLabel('Role').selectOption('2');

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect(
            page.getByText('User created successfully!')
        ).toBeVisible();

        // Form should be cleared after successful creation.
        await expect(page.getByLabel('Username')).toHaveValue('');
        await expect(page.getByLabel('Email address')).toHaveValue('');
        await expect(page.getByLabel('Password')).toHaveValue('');
        await expect(page.getByLabel('Role')).toHaveValue('');
    });

    test('sends correct data when creating user', async ({ page }) => {
        let requestBody: any;

        await page.route(API.createUser, async (route) => {
            requestBody = route.request().postDataJSON();

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    message: 'User created successfully',
                }),
            });
        });

        await page.goto('/owner/adduser');

        await page.getByLabel('Username').fill(NEW_USER.username);
        await page.getByLabel('Email address').fill(NEW_USER.email);
        await page.getByLabel('Password').fill(NEW_USER.password);
        await page.getByLabel('Role').selectOption('2');

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect.poll(() => requestBody).toEqual({
            username: NEW_USER.username,
            email: NEW_USER.email,
            password: NEW_USER.password,
            roleId: 2,
        });
    });

    test('shows server error when creating user fails', async ({ page }) => {
        await mockJson(
            page,
            API.createUser,
            { message: 'Email is already in use' },
            400
        );

        await page.goto('/owner/adduser');

        await page.getByLabel('Username').fill(NEW_USER.username);
        await page.getByLabel('Email address').fill(NEW_USER.email);
        await page.getByLabel('Password').fill(NEW_USER.password);
        await page.getByLabel('Role').selectOption('2');

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect(
            page.getByText('Email is already in use')
        ).toBeVisible();
    });

    test('shows default error when server returns an error without a message', async ({ page }) => {
        await mockJson(
            page,
            API.createUser,
            {},
            500
        );

        await page.goto('/owner/adduser');

        await page.getByLabel('Username').fill(NEW_USER.username);
        await page.getByLabel('Email address').fill(NEW_USER.email);
        await page.getByLabel('Password').fill(NEW_USER.password);
        await page.getByLabel('Role').selectOption('2');

        await page.getByRole('button', { name: 'Create user' }).click();

        await expect(
            page.getByText('Could not create user.')
        ).toBeVisible();
    });

});