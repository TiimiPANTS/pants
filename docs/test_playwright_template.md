# Frontend tests

The frontend uses Playwright to check that important customer reservation flows, as well as user login and management flows, work correctly in a browser. The tests run against the local Vite app, which Playwright starts automatically.

## What the tests cover

### Making a reservation
The tests in [`frontend/tests/reservation.spec.ts`](../frontend/tests/reservation.spec.ts) check that a customer can:

- Open the reservation page and see its main sections.
- Select a date and time, choose a party size, and submit a reservation.
- See helpful messages when required details are missing or invalid.
- See an error message if submitting the reservation fails.

The tests use sample API responses instead of the real backend. This keeps them predictable and means you do not need to start the backend or connect to a database to run them.

### Editing a reservation

The tests in [`frontend/tests/reservation-modify-e2e.spec.ts`](../frontend/tests/reservation-modify-e2e.spec.ts) check that a customer can edit an existing reservation. They verify that a customer can:

- Open an existing reservation using its unique edit token.
- View the existing reservation details, including contact information and party size.
- Change the party size.
- Change the reservation time.
- Update their name and special requests.
- Save changes and verify that they are stored correctly.
- Reopen the edit page and see the previously saved changes.

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

### Adding a user

The tests in [`frontend/tests/adduser.spec.ts`](../frontend/tests/adduser.spec.ts) check that an admin or owner can:

- Open the Add User page and see the user creation form.
- Access the page as an admin or owner.
- Be redirected to the login page when unauthorized or forbidden.
- Be redirected to the login page when attempting to access the page as an employee.
- Navigate to the dashboard using the Dashboard button.
- Return to user management using the Cancel button.
- Log out and return to the login page.
- Enter a username, email address, password and role.
- Select all available roles when logged in as an admin.
- Select only the owner and employee roles when logged in as an owner.
- See validation errors when submitting the form with empty or missing fields.
- Successfully create a new user.
- See a success message and have the form cleared after successful creation.
- See an appropriate error message if user creation fails.
- See a default error message if the server does not provide an error message.

### Editing personal information

The tests in [`frontend/tests/edituser.spec.ts`](../frontend/tests/edituser.spec.ts) check that a logged-in user can:

- Open the My Account page.
- View their current username and email address.
- Navigate to the dashboard.
- Log out and return to the login page.
- Be redirected to the login page when unauthorized or forbidden.
- Update their username and email address successfully.
- See their updated information displayed in the form.
- See an error message if updating their account information fails.
- See a default error message if the server does not provide an error message.

### Changing password

The tests in [`frontend/tests/edituser.spec.ts`](../frontend/tests/edituser.spec.ts) check that a logged-in user can:

- View the password change form.
- Enter their current password, new password and password confirmation.
- See a validation error when any password field is empty.
- See a validation error when the new password and confirmation do not match.
- See a validation error when the new password is the same as the current password.
- Successfully change their password.
- See a success message and have the password fields cleared after a successful update.
- See an error message if the password change fails, for example when the current password is incorrect.

### Owner dashboard

The tests in [`frontend/tests/system-reservation-lifecycle.spec.ts`](../frontend/tests/system-reservation-lifecycle.spec.ts) check that an owner can:

- Open the dashboard and view existing reservations.
- See reservation information, including the customer’s name and email address.
- See the status of a cancelled reservation.
- See that the Cancel action is not available for reservations that have already been cancelled.

### Complete reservation workflow

The tests in [`frontend/tests/system-reservation-lifecycle.spec.ts`](../frontend/tests/system-reservation-lifecycle.spec.ts)  verify that the complete reservation cancellation workflow works across the frontend, backend and database:

1. A customer creates a reservation through the reservation form.
2. The customer opens the reservation management page using the edit token.
3. An owner logs in using a separate browser session.
4. The owner finds the customer’s reservation on the dashboard.
5. The owner cancels the reservation.
6. The dashboard displays the reservation as cancelled.
7. The customer opens the reservation management page and sees that the reservation has been cancelled.

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
