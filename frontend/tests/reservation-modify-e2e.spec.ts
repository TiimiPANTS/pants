import { test, expect } from '@playwright/test';
import {
    cancelReservationViaApi,
    chooseNextMonthDay,
    chooseTime,
    confirmReservation,
    createReservationViaApi,
    fillContactDetails,
    getReservationViaApi,
    openEditPage,
    openNewReservationPage,
    reservationDate,
    reservationForm,
    editTokenFromUrl,
    updateReservation,
} from './helpers/reservationHelpers.ts';

// Run tests one at a time – they use the real database and the same time slots
test.describe.configure({ mode: 'serial' });

// setup: a fresh reservation for every test

let editToken: string;

test.beforeEach(async ({ request }) => {
    editToken = await createReservationViaApi(request);
});

test.afterEach(async ({ request }) => {
    if (editToken) {
        await cancelReservationViaApi(request, editToken);
    }
});

// tests

test('customer can create a reservation in the UI and open the edit page', async ({ page, request }) => {
    const form = reservationForm(page);

    await openNewReservationPage(page);
    await chooseNextMonthDay(page, reservationDate());
    await chooseTime(page, '13:00');
    await fillContactDetails(page, { firstName: 'Uusi', lastName: 'Asiakas', email: 'uusi@example.com' });
    await confirmReservation(page);

    await form.editButton.click();
    await expect(form.editHeading).toBeVisible();
    await expect(form.firstName).toHaveValue('Uusi');

    // clean up the reservation made in this test
    await cancelReservationViaApi(request, editTokenFromUrl(page));
});

test('edit page shows the existing reservation details', async ({ page }) => {
    const form = reservationForm(page);
    await openEditPage(page, editToken);

    await expect(form.firstName).toHaveValue('Testi');
    await expect(form.lastName).toHaveValue('Tester');
    await expect(form.email).toHaveValue('e2e@example.com');
    await expect(form.guestCount).toHaveValue('2');
});

test('customer can change the party size', async ({ page, request }) => {
    const form = reservationForm(page);
    await openEditPage(page, editToken);

    await form.increaseGuestsButton.click();
    await form.increaseGuestsButton.click();
    await expect(form.guestCount).toHaveValue('4');

    await updateReservation(page);

    const saved = await getReservationViaApi(request, editToken);
    expect(saved.partySize).toBe(4);
});

test('customer can change the time', async ({ page, request }) => {
    await openEditPage(page, editToken);

    await chooseTime(page, '14:00');
    await updateReservation(page);

    const saved = await getReservationViaApi(request, editToken);
    expect(saved.startTime).toContain('14:00');
});

test('customer can change name and special requests', async ({ page, request }) => {
    const form = reservationForm(page);
    await openEditPage(page, editToken);

    await form.firstName.fill('Muokattu');
    await form.specialRequests.fill('Birthday dinner');
    await updateReservation(page);

    const saved = await getReservationViaApi(request, editToken);
    expect(saved.customer.firstname).toBe('Muokattu');
    expect(saved.details).toBe('Birthday dinner');
});

test('changes are still visible after reopening the edit page', async ({ page }) => {
    const form = reservationForm(page);
    await openEditPage(page, editToken);

    await form.firstName.fill('Tallennettu');
    await updateReservation(page);

    await openEditPage(page, editToken);
    await expect(form.firstName).toHaveValue('Tallennettu');
});
