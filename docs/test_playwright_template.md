# Frontend tests

The frontend uses Playwright to check that important reservation flows work in a browser. The tests run against the local Vite app, which Playwright starts automatically.

## What the tests cover

The tests in [`frontend/tests/reservation.spec.ts`](../frontend/tests/reservation.spec.ts) check that a customer can:

- Open the reservation page and see its main sections.
- Select a date and time, choose a party size, and submit a reservation.
- See helpful messages when required details are missing or invalid.
- See an error message if submitting the reservation fails.

The tests use sample API responses instead of the real backend. This keeps them predictable and means you do not need to start the backend or connect to a database to run them.

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
