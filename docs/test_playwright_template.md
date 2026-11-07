# Frontend tests

The frontend uses Playwright to check that important reservation and login flows work in a browser. The tests run against the local Vite app, which Playwright starts automatically.

## What the tests cover

### Making a reservation
The tests in [`frontend/tests/reservation.spec.ts`](../frontend/tests/reservation.spec.ts) check that a customer can:

- Open the reservation page and see its main sections.
- Select a date and time, choose a party size, and submit a reservation.
- See helpful messages when required details are missing or invalid.
- See an error message if submitting the reservation fails.

The tests use sample API responses instead of the real backend. This keeps them predictable and means you do not need to start the backend or connect to a database to run them.

### Cancelling a reservation

#### Cancellation by owner

The tests in [`frontend/tests/reservationcancel-admin.spec.ts`](../frontend/tests/reservationcancel-admin.spec.ts) check that an owner can:

- Open the owner dashboard and view existing reservations.
- Open the cancellation page for a reservation.
- Return to the dashboard without cancelling the reservation.
- Successfully cancel a reservation.
- See a cancelled status instead of the Cancel button for an already cancelled reservation.
- See an information message when attempting to cancel an already cancelled reservation.
- See an error message if cancellation fails.

#### Cancellation by customer

The tests in [`frontend/tests/reservationcancel-customer.spec.ts`](../frontend/tests/reservationcancel-customer.spec.ts) check that a customer can:

- Open an existing reservation using its unique edit token.
- View their reservation details.
- Successfully cancel a reservation after confirming the cancellation.
- Decline the cancellation confirmation and keep the reservation unchanged.
- See an error message when using an invalid edit token.
- See an error message if cancellation fails.

The cancellation tests use mocked API responses instead of real backend data. This keeps the tests predictable and means that no database connection is required.

### Admin & owner login

The tests in [`frontend/tests/login.spec.ts`](../frontend/tests/login.spec.ts) check that an admin & owner can:

- Open the login page successfully.
- See the login form components, including email and password fields and the Sign in button.
- Successfully log in and navigate to the owner dashboard.
- See validation errors when submitting an empty login form.
- See a validation error when entering an invalid email address.
- See an error message when entering incorrect login credentials.

The tests use mocked API responses instead of the real backend. This allows login success and failure scenarios to be tested without connecting to the actual authentication service.

## Run the tests

Open a terminal in the `frontend` folder. Install dependencies the first time, then install the browsers used by the tests:

```powershell
npm install
npx playwright install
```

Run all tests:

```powershell
npm test
```

Run just the reservation tests in Chromium:

```powershell
npm test -- tests/reservation.spec.ts --project=chromium
```

The Playwright configuration also runs tests in Firefox and WebKit. To open the interactive test runner, use:

```powershell
npm test -- --ui
```

Playwright saves an HTML report after a run. Open it with:

```powershell
npx playwright show-report
```

## Adding a test

Add a test to `frontend/tests/reservation.spec.ts` using Playwright's `test` and `expect`:

```ts
test('reservation page shows the date section', async ({ page }) => {
  await page.goto('/reserve');

  await expect(
    page.getByRole('heading', { name: '1. Select Date' })
  ).toBeVisible();
});
```

Use the existing tests as examples for selecting form fields, checking validation messages, and supplying sample API responses.

For more examples, see the [Playwright documentation](https://playwright.dev/docs/intro).
