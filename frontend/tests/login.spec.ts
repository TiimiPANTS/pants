import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                message: 'Login successful',
                email: 'admin@test.com',
                role: 'ADMIN',
            }),
        });
    });
});

async function gotoLoginPage(page: Page) {
    await page.goto('/login');
}

async function fillLoginForm(
    page: Page,
    email = 'testadmin@test.com',
    password = 'test123'
) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
}

test('login page loads successfully', async ({ page }) => {
    await gotoLoginPage(page);
    await expect(page).toHaveURL(/\/login$/);
    await expect(
        page.getByRole('heading', { name: 'Welcome back' })
    ).toBeVisible();
});

test('login form components are visible', async ({ page }) => {
    await gotoLoginPage(page);
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(
        page.getByRole('button', { name: 'Sign in' })
    ).toBeVisible();
    await expect(
        page.getByRole('link', { name: 'Back to reservations' })
    ).toBeVisible();
});

test('admin can successfully log in', async ({ page }) => {
    await gotoLoginPage(page);
    await fillLoginForm(page);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/owner\/dashboard$/);
});

test('empty login form displays validation errors', async ({ page }) => {
    await gotoLoginPage(page);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
});

test('invalid email displays a validation error', async ({ page }) => {
    await gotoLoginPage(page);
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('test123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
        page.getByText('Enter an email like name@example.com')
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
});

test('invalid credentials display an error message', async ({ page }) => {
    await page.unroute('**/api/auth/login');
    await page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
                message: 'Invalid email or password',
            }),
        });
    });

    await gotoLoginPage(page);
    await fillLoginForm(page);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
        page.getByRole('alert')
    ).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/login$/);
});