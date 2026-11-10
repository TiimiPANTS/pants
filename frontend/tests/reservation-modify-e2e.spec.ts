import { test, expect, type Page } from '@playwright/test';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';

// Run tests one at a time – they use the real database and the same time slots
test.describe.configure({ mode: 'serial' });

// helpers

// The 10th of next month (or 11th if the 10th is a Sunday – restaurant is closed)
function reservationDate() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 10);
    if (d.getDay() === 0) d.setDate(11);
    return d;
}

// "10.12.2026" – the format the backend expects
function backendDate(d: Date) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
}

// "Thursday, December 10th, 2026" – the date picker's button name
function dayLabel(d: Date) {
    const day = d.getDate();
    const suffix =
        day % 10 === 1 && day !== 11 ? 'st' :
        day % 10 === 2 && day !== 12 ? 'nd' :
        day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    return `${weekday}, ${month} ${day}${suffix}, ${d.getFullYear()}`;
}

function section(page: Page, heading: string) {
    return page.locator('section').filter({ has: page.getByRole('heading', { name: heading }) });
}

async function chooseTime(page: Page, time: string) {
    const button = section(page, '3. Select Time').getByRole('button', { name: new RegExp(`^${time},`) });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(button).toHaveClass(/border-2/);
}

async function openEditPage(page: Page, token: string) {
    await page.goto(`/reserve/${token}`);
    await expect(page.getByRole('heading', { name: 'Edit your reservation' })).toBeVisible();
}

// setup: a fresh reservation for every test 

let editToken: string;

test.beforeEach(async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/reservations`, {
        data: {
            customer: { firstname: 'Testi', lastname: 'Tester', email: 'e2e@example.com' },
            datetime: `${backendDate(reservationDate())} 12:00`,
            startTime: '12:00',
            endTime: '14:00',
            partySize: 2,
            details: '',
        },
    });
    expect(res.status()).toBe(201);
    editToken = (await res.json()).editToken;
});

test.afterEach(async ({ request }) => {
    if (editToken) {
        await request.patch(`${BACKEND}/api/reservations/manage/${editToken}/cancel`);
    }
});

// tests 

test('customer can create a reservation in the UI and open the edit page', async ({ page, request }) => {
    await page.goto('/reserve');
    await page.getByRole('button', { name: '›' }).click();
    await page.getByRole('button', { name: dayLabel(reservationDate()) }).click();
    await chooseTime(page, '13:00');

    await page.getByLabel('First Name').fill('Uusi');
    await page.getByLabel('Last Name').fill('Asiakas');
    await page.getByLabel('Email').fill('uusi@example.com');
    await page.getByRole('button', { name: 'Confirm Reservation' }).click();

    await expect(page.getByRole('heading', { name: 'Reservation Confirmed!' })).toBeVisible();

    await page.getByRole('button', { name: 'Edit Reservation' }).click();
    await expect(page.getByRole('heading', { name: 'Edit your reservation' })).toBeVisible();
    await expect(page.getByLabel('First Name')).toHaveValue('Uusi');

    // clean up the reservation made in this test
    const uiToken = page.url().split('/reserve/')[1];
    await request.patch(`${BACKEND}/api/reservations/manage/${uiToken}/cancel`);
});

test('edit page shows the existing reservation details', async ({ page }) => {
    await openEditPage(page, editToken);

    await expect(page.getByLabel('First Name')).toHaveValue('Testi');
    await expect(page.getByLabel('Last Name')).toHaveValue('Tester');
    await expect(page.getByLabel('Email')).toHaveValue('e2e@example.com');
    await expect(section(page, '2. Party Size').getByText('2 Guests')).toBeVisible();
});

test('customer can change the party size', async ({ page, request }) => {
    await openEditPage(page, editToken);

    const plus = section(page, '2. Party Size').getByRole('button', { name: '+' });
    await plus.click();
    await plus.click();
    await expect(section(page, '2. Party Size').getByText('4 Guests')).toBeVisible();

    await page.getByRole('button', { name: 'Update Reservation' }).click();
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed!' })).toBeVisible();

    const saved = await (await request.get(`${BACKEND}/api/reservations/manage/${editToken}`)).json();
    expect(saved.partySize).toBe(4);
});

test('customer can change the time', async ({ page, request }) => {
    await openEditPage(page, editToken);

    await chooseTime(page, '14:00');
    await page.getByRole('button', { name: 'Update Reservation' }).click();
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed!' })).toBeVisible();

    const saved = await (await request.get(`${BACKEND}/api/reservations/manage/${editToken}`)).json();
    expect(saved.startTime).toContain('14:00');
});

test('customer can change name and special requests', async ({ page, request }) => {
    await openEditPage(page, editToken);

    await page.getByLabel('First Name').fill('Muokattu');
    await page.locator('#specialRequests').fill('Birthday dinner');
    await page.getByRole('button', { name: 'Update Reservation' }).click();
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed!' })).toBeVisible();

    const saved = await (await request.get(`${BACKEND}/api/reservations/manage/${editToken}`)).json();
    expect(saved.customer.firstname).toBe('Muokattu');
    expect(saved.details).toBe('Birthday dinner');
});

test('changes are still visible after reopening the edit page', async ({ page }) => {
    await openEditPage(page, editToken);

    await page.getByLabel('First Name').fill('Tallennettu');
    await page.getByRole('button', { name: 'Update Reservation' }).click();
    await expect(page.getByRole('heading', { name: 'Reservation Confirmed!' })).toBeVisible();

    await openEditPage(page, editToken);
    await expect(page.getByLabel('First Name')).toHaveValue('Tallennettu');
});
