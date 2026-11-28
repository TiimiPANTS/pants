# Frontend tests

The frontend uses Playwright to check that important customer reservation flows, as well as user login and management flows, work correctly in a browser. The tests run against the local Vite app, which Playwright starts automatically.

There are two kinds of tests:

- **Mocked tests** (`reservation`, `reservationcancel-admin`, `reservationcancel-customer`, `login`, `adduser`, `edituser`) replace API responses with sample data. They need only the frontend.
- **End-to-end tests** (`reservation-modify-e2e`, `system-reservation-lifecycle`) use the real backend and database. The backend must be running before you start them; see [Run the tests](#run-the-tests).

## What the tests cover

### Making a reservation
The tests in [`frontend/tests/reservation.spec.ts`](../frontend/tests/reservation.spec.ts) check that a customer can:

- Open the reservation page and see the date, party size and time steps first.
- Not see the contact details and confirm button until a time is picked.
- Select a date and time, choose a party size, and submit a reservation, which opens the confirmation page.
- See helpful messages when contact details are missing, too short, malformed (email), or longer than 50 characters (names).
- See an error message, and stay on the form, if submitting the reservation fails.

The tests use sample API responses instead of the real backend. This keeps them predictable and means you do not need to start the backend or connect to a database to run them.

### Editing a reservation

The tests in [`frontend/tests/reservation-modify-e2e.spec.ts`](../frontend/tests/reservation-modify-e2e.spec.ts) check that a customer can edit an existing reservation. They verify that a customer can:

- Create a reservation in the UI and open its edit page from the confirmation page.
- Open an existing reservation using its unique edit token.
- View the existing reservation details, including contact information and party size.
- Change the party size.
- Change the reservation time.
- Update their name and special requests.
- Save changes and verify that they are stored correctly.
- Reopen the edit page and see the previously saved changes.

These are end-to-end tests: they use the real backend and database, with no mocked responses. Before each test a fresh reservation is created through the backend API, and after each test it is cancelled again. Saved changes are checked by reading the reservation back from the API. The tests run one at a time (`mode: 'serial'`) because they share the same database and time slots.

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
- See a "Reservation cancelled" notice, and no Cancel button, when opening a reservation that is already cancelled.
- See an error message when using an invalid edit token.
- See an error message if cancellation fails.

Both cancellation test files use mocked API responses instead of real backend data. This keeps the tests predictable and means that no database connection is required.

### Admin & owner login

The tests in [`frontend/tests/login.spec.ts`](../frontend/tests/login.spec.ts) check that an admin & owner can:

- Open the login page successfully.
- See the login form components, including email and password fields and the Sign in button.
- Successfully log in, navigate to the owner dashboard, and have the login token stored.
- See validation errors when submitting an empty login form.
- See a validation error when entering an invalid email address.
- See an error message when entering incorrect login credentials.

The tests use mocked API responses instead of the real backend. This allows login success and failure scenarios to be tested without connecting to the actual authentication service.

### Adding a user

The tests in [`frontend/tests/adduser.spec.ts`](../frontend/tests/adduser.spec.ts) check that an admin or owner can:

- Open the Add User page and see the user creation form.
- Access the page as an admin or owner.
- Be redirected to the login page when unauthorized or forbidden.
- Be redirected to the dashboard when attempting to access the page as an employee.
- Navigate to the dashboard using the Dashboard button.
- Return to user management using the Cancel button.
- Log out and return to the login page.
- Enter a username, email address, password and role.
- Select all available roles when logged in as an admin.
- Select only the owner and employee roles when logged in as an owner.
- See validation errors when submitting the form with empty or missing fields.
- Successfully create a new user, with the correct data sent to the server.
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

### Complete reservation workflow

The test in [`frontend/tests/system-reservation-lifecycle.spec.ts`](../frontend/tests/system-reservation-lifecycle.spec.ts) is a system test. It verifies that the complete reservation cancellation workflow works across the real frontend, backend and database, with no mocks:

1. A customer creates a reservation through the reservation form.
2. The customer opens the reservation management page using the edit token.
3. An owner logs in using a separate browser session.
4. The owner finds the customer’s reservation on the dashboard.
5. The owner cancels the reservation.
6. The dashboard displays the reservation as cancelled.
7. The customer opens the reservation management page and sees that the reservation has been cancelled.

The customer and owner use separate browser contexts, so they act like two different users. The customer books with a unique email address so the booking can be found reliably on the dashboard, and the 15:00 time slot is used because the other real-database tests do not book it. If the test fails partway, the reservation is still cancelled through the API at the end.

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

`npm test` also runs the end-to-end tests, so the backend must be running first (see the project README for how to start it). The end-to-end tests use these settings:

| Environment variable | Default | Used for |
| :--- | :--- | :--- |
| `BACKEND_URL` | `http://localhost:8080` | Creating, reading and cancelling reservations through the API |
| `OWNER_EMAIL` | `owner@test.com` | Owner login in the system test |
| `OWNER_PASSWORD` | `owner123` | Owner login in the system test |

The default owner account is created automatically when the backend starts (`AdminLoginConfig`). To run only the mocked tests without a backend, name their files, for example `npm test -- tests/reservation.spec.ts tests/login.spec.ts`.

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
