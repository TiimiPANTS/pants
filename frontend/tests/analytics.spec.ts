import { test, expect } from '@playwright/test';
import { mockJson } from './helpers/mockApi.ts';

const EMPLOYEE_USER = { id: 3, username: 'employee', email: 'employee@test.com', roleId: 3 };

test('employee sees the analytics tab and can open it', async ({ page }) => {
    await mockJson(page, '**/api/users/me', EMPLOYEE_USER);
    await mockJson(page, '**/api/reservations', []);
    await mockJson(page, '**/api/tables', []);
    await mockJson(page, '**/api/reservations/stats?*', {
        weekStart: '2026-11-23',
        weekEnd: '2026-11-29',
        totalReservations: 0,
        busiestDay: null,
        busiestTime: null,
        reservationsByDay: {},
        reservationsByTime: {},
    });

    await page.goto('/analytics');

    const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
    await expect(sidebar.getByRole('button', { name: 'Analytics' })).toHaveAttribute('aria-current', 'page');
    await expect(sidebar.getByRole('button', { name: 'Users' })).toHaveCount(0);
    await expect(page.getByText('Avg party size')).toBeVisible();
    await expect(page.getByText('You do not have access to analytics.')).toHaveCount(0);
});
