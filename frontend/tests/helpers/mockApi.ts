import type { Page } from '@playwright/test';

// Replaces any earlier mock for the same URL pattern, so a test can override a beforeEach mock
export async function mockJson(page: Page, url: string, body: unknown, status = 200) {
    await page.unroute(url);
    await page.route(url, (route) =>
        route.fulfill({
            status,
            contentType: 'application/json',
            body: JSON.stringify(body),
        })
    );
}

export const ADMIN_USER = {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    roleId: 1,
} as const;
