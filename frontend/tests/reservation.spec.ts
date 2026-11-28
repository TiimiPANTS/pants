import { test, expect, type Page } from '@playwright/test';
import { mockJson } from './helpers/mockApi.ts';
import { fillContactDetails, reservationForm } from './helpers/reservationHelpers.ts';

// Runs against mocked API responses, so no backend or database is needed.

const RESERVE_URL = /\/reserve$/;
const CONFIRMATION_URL = /\/confirmation$/;

// The clock is frozen two days before the one bookable sample slot
const TODAY = new Date('2026-10-17T12:00:00');
const SLOT_DATE = new Date('2026-10-19T00:00:00'); // a Monday
const SLOT_TIME = '10:00';
const SLOT_CAPACITY = 10;

const RESERVATION_ID = 123;

const CUSTOMER = {
    firstName: 'Test',
    lastName: 'Customer',
    email: 'test@example.com',
};

const API = {
    availability: '**/api/reservations/availability**',
    reservations: '**/api/reservations',
    receipt: `**/api/receipts/${RESERVATION_ID}`,
};

const createdReservation = {
    reservationId: RESERVATION_ID,
    editToken: 'test-edit-token',
    customer: {
        id: 456,
        firstname: CUSTOMER.firstName,
        lastname: CUSTOMER.lastName,
        email: CUSTOMER.email,
    },
    datetime: '19.10.2026 10:00',
    startTime: SLOT_TIME,
    endTime: '10:30',
    partySize: 2,
    details: '',
};

const STEP_HEADINGS = {
    date: '1. Select Date',
    partySize: '2. Party Size',
    time: '3. Select Time',
    contact: '4. Contact Details',
};

test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(TODAY);
    await mockJson(page, API.availability, [
        { date: '2026-10-19', startTime: SLOT_TIME, availableCapacity: SLOT_CAPACITY },
    ]);
});

// Opens the form and waits until the available times have loaded
async function openReservationPage(page: Page) {
    const availabilityLoaded = page.waitForResponse(
        (response) => response.url().includes('/api/reservations/availability') && response.ok()
    );
    await page.goto('/reserve');
    await availabilityLoaded;
}

// Picks the one date and time the availability mock offers
async function pickSampleSlot(page: Page) {
    const form = reservationForm(page);
    await form.dayButton(SLOT_DATE).click();

    await expect(form.timeButton(SLOT_TIME)).toBeEnabled();
    await form.timeButton(SLOT_TIME).click();
}

async function submit(page: Page) {
    await reservationForm(page).confirmButton.click();
}

function stepHeading(page: Page, name: string) {
    return page.getByRole('heading', { name });
}

test.describe('Reservation form layout', () => {
    test('shows the date, party size and time steps first', async ({ page }) => {
        await openReservationPage(page);

        await expect(page).toHaveURL(RESERVE_URL);
        await expect(stepHeading(page, STEP_HEADINGS.date)).toBeVisible();
        await expect(stepHeading(page, STEP_HEADINGS.partySize)).toBeVisible();
        await expect(stepHeading(page, STEP_HEADINGS.time)).toBeVisible();
    });

    test('contact details and confirm stay hidden until a time is picked', async ({ page }) => {
        await openReservationPage(page);

        await expect(stepHeading(page, STEP_HEADINGS.contact)).toBeHidden();
        await expect(reservationForm(page).confirmButton).toBeHidden();
        await expect(page.getByText('Pick a time above to add your details.')).toBeVisible();

        await pickSampleSlot(page);

        await expect(stepHeading(page, STEP_HEADINGS.contact)).toBeVisible();
        await expect(reservationForm(page).confirmButton).toBeVisible();
    });

    test('guests can change the party size and pick a time', async ({ page }) => {
        const PARTY_SIZE = 8;
        const form = reservationForm(page);

        await openReservationPage(page);
        await form.dayButton(SLOT_DATE).click();

        // The form starts at 2 guests
        for (let guests = 2; guests < PARTY_SIZE; guests++) {
            await form.increaseGuestsButton.click();
        }
        await expect(page.getByText(`${PARTY_SIZE} Guests`)).toBeVisible();

        await form.timeButton(SLOT_TIME).click();
        await expect(form.timeButton(SLOT_TIME)).toHaveAttribute('aria-pressed', 'true');
    });
});

test.describe('Submitting a reservation', () => {
    test('valid details open the confirmation page', async ({ page }) => {
        await mockJson(page, API.reservations, createdReservation, 201);
        // The confirmation page asks for a receipt after the booking is created
        await page.route(API.receipt, (route) => route.fulfill({ status: 200, body: '' }));

        await openReservationPage(page);
        await pickSampleSlot(page);
        await fillContactDetails(page, CUSTOMER);
        await submit(page);

        await expect(page).toHaveURL(CONFIRMATION_URL);
        await expect(reservationForm(page).confirmedHeading).toBeVisible();
        await expect(page.getByText(String(RESERVATION_ID), { exact: true })).toBeVisible();
    });

    test('a server error is shown and the guest stays on the form', async ({ page }) => {
        await mockJson(page, API.reservations, { message: 'Something went wrong' }, 500);

        await openReservationPage(page);
        await pickSampleSlot(page);
        await fillContactDetails(page, CUSTOMER);
        await submit(page);

        await expect(page.getByText('Something went wrong')).toBeVisible();
        await expect(page).toHaveURL(RESERVE_URL);
    });
});

test.describe('Contact detail validation', () => {
    test.beforeEach(async ({ page }) => {
        await openReservationPage(page);
        await pickSampleSlot(page);
    });

    test('empty fields show required errors', async ({ page }) => {
        await submit(page);

        await expect(page.getByText('First name is required.')).toBeVisible();
        await expect(page.getByText('Last name is required.')).toBeVisible();
        await expect(page.getByText('Email is required.')).toBeVisible();
        await expect(page).toHaveURL(RESERVE_URL);
    });

    test('too short names and a malformed email show format errors', async ({ page }) => {
        await fillContactDetails(page, { firstName: 'A', lastName: 'A', email: 'testexamplecom' });
        await submit(page);

        await expect(page.getByText('First name must be at least 2 characters.')).toBeVisible();
        await expect(page.getByText('Last name must be at least 2 characters.')).toBeVisible();
        await expect(page.getByText('Enter an email like name@example.com')).toBeVisible();
        await expect(page).toHaveURL(RESERVE_URL);
    });

    test('names longer than 50 characters show length errors', async ({ page }) => {
        const tooLongName = 'A'.repeat(51);

        await fillContactDetails(page, { firstName: tooLongName, lastName: tooLongName, email: CUSTOMER.email });
        await submit(page);

        await expect(page.getByText('First name must be 50 characters or less.')).toBeVisible();
        await expect(page.getByText('Last name must be 50 characters or less.')).toBeVisible();
        await expect(page).toHaveURL(RESERVE_URL);
    });
});
