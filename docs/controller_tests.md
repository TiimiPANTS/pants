# Backend controller tests

The controller tests are in [`backend/src/test/java/com/pants/backend/controller`](../backend/src/test/java/com/pants/backend/controller). They use JUnit 6, Mockito and AssertJ.

They are plain unit tests: each controller is created with `@InjectMocks`, its repositories or services are mocked, and its methods are called directly. They check the returned status code and body, and whether the controller saved or deleted anything. They do **not** send real HTTP requests, so routes, JSON, request validation and security are not tested here (only `BackendApplicationTests` does that; see the end of this page).

To run the backend tests, see the README.

## CustomerController (`/api/customers`)

`CustomerControllerTest`

| Test | Checks that |
| :--- | :--- |
| `getAll_whenCustomersExist_returnsOk` / `getAll_whenNoCustomers_returnsNotFound` | Listing customers returns 200 with the customers, or 404 when there are none. |
| `getById_whenExists_returnsOk` / `getById_whenNotExists_returnsNotFound` | Fetching a customer returns 200, or 404 for a missing ID. |
| `create_withValidData_returnsCreated` | A valid customer is saved and returned with 201. |
| `create_withInvalidData_returnsBadRequest` (parameterized) | A null, empty or blank first name, last name or email returns 400 and nothing is saved. |
| `create_whenRepositoryThrows_returnsBadRequest` | A duplicate email from the database returns 400. |
| `update_withValidData_returnsOk` | A valid update is saved and returned with 200. |
| `update_whenNotExists_returnsNotFound` / `update_whenNotExistsAndInvalidData_returnsNotFound` | Updating a missing customer returns 404, even when the data is also invalid. |
| `update_withInvalidData_returnsBadRequest` (parameterized) | Blank required fields on update return 400 and nothing is saved. |
| `delete_whenExists_returnsOk` / `delete_whenNotExists_returnsNotFound` | Deleting returns 200, or 404 without deleting when the customer is missing. |

`CustomerValidationTest` checks the stricter field rules on create and update:

| Test | Checks that |
| :--- | :--- |
| `create_rejectsInvalidFirstname` / `create_acceptsValidFirstname` (parameterized) | First names that are 1 character, over 50 characters, or contain numbers or special characters are rejected; names like `Matti-Pekka`, `Äänekoski` and `Ma` are accepted. |
| `create_rejectsInvalidLastname` (parameterized) | Invalid last names are rejected. |
| `create_rejectsInvalidEmail` / `create_rejectsTooLongEmail` / `create_acceptsValidEmail` | Malformed or too-long emails are rejected; a valid one is accepted. |
| `update_rejectsInvalidFirstname` | An invalid first name on update returns 400 and the stored customer is unchanged. |

## ReservationController (`/api/reservations`)

`ReservationControllerTest`. The service is mocked, so these tests mainly check that service results and exceptions are turned into the right status codes: not found → 404, invalid input → 400, not allowed → 409.

| Test | Checks that |
| :--- | :--- |
| `getAll_*` | Listing returns 200 with reservations or an empty list. |
| `getAvailability_returnsOnlyAvailabilityData` | Availability for a valid range returns 200 with the available capacity. |
| `getAvailability_whenRangeExceedsLimit_returnsBadRequest` | A range longer than 31 days returns 400 without calling the service. |
| `getById_*` / `getByToken_*` | Fetching by ID or edit token returns 200, or 404 when missing. |
| `create_*` | Creating returns 201 with the edit token, or 400 for invalid data. |
| `update_*` | Updating by ID returns 200, 404 or 400. |
| `updateByToken_*` | Updating by edit token returns 200, 404, 400, or 409 when changes are no longer allowed. |
| `cancelByToken_*` | Cancelling by token returns 200, 404, or 409 when already cancelled or too late. |
| `cancelById_*` | Cancelling by ID returns 200 with status `CANCELLED`, 404, or 409 when already cancelled. |
| `delete_*` | Deleting returns 200, or 404 when missing. |

## TableController (`/api/tables`)

`TableControllerTest`

| Test | Checks that |
| :--- | :--- |
| `getAll_*` / `getById_*` | Fetching tables returns 200, or 404 when there are none or the ID is missing. |
| `create_whenValid_returnsCreated` / `create_whenRepositoryThrows_returnsBadRequest` | Creating returns 201, or 400 if saving fails. |
| `update_whenFound_returnsOk` / `update_whenNotFound_returnsNotFound` | Updating changes table number and capacity, or returns 404 without saving. |
| `delete_whenFound_returnsOk` / `delete_whenNotFound_returnsNotFound` | Deleting returns 200, or 404 without deleting. |

## TableListController (`/api/tablelists`)

`TableListControllerTest`. Table assignments link a reservation to a table.

| Test | Checks that |
| :--- | :--- |
| `getAll_*` / `getById_*` | Fetching assignments returns 200, or 404 when missing. |
| `create_whenIdMissing_returnsBadRequest` / `create_whenTableIdMissing_returnsBadRequest` | A missing reservation or table ID returns 400. |
| `create_whenReservationMissing_returnsNotFound` / `create_whenTableMissing_returnsNotFound` | A reservation or table that doesn't exist returns 404. |
| `create_whenAlreadyExists_returnsBadRequest` | A duplicate assignment returns 400. |
| `create_whenCapacityTooSmall_returnsBadRequest` | A table too small for the party returns 400. |
| `create_whenUnavailable_returnsConflict` | A table already booked at that time returns 409. |
| `create_whenValid_returnsCreated` | A valid assignment is saved and returned with 201. |
| `delete_whenFound_returnsOk` / `delete_whenNotFound_returnsNotFound` | Deleting returns 200, or 404. |

None of the failing create cases save anything.

## TableDTO validation

`TableDTOTest` (in `dto/`) runs Bean Validation directly on `TableDTO`, with no Spring or mocks.

| Test | Checks that |
| :--- | :--- |
| `validate_whenFieldsValid_hasNoViolations` | Table number 1 and capacity 4 are valid. |
| `validate_whenTableNumberZero_returnsTableNumberViolation` | Table number 0 gives "Table number must be at least 1". |
| `validate_whenCapacityNegative_returnsCapacityViolation` | Capacity -2 gives "Capacity must be at least 1". |
| `validate_whenFieldsMissing_returnsBothViolations` | An empty DTO gives "Table number is required" and "Capacity is required". |

## GlobalExceptionHandler

`GlobalExceptionHandlerTest`

| Test | Checks that |
| :--- | :--- |
| `returnsBadRequestWithFieldNameAndMessage` | A validation error returns 400 with a message like `Invalid data: email: must be a well-formed email address`. |
| `joinsMultipleFieldErrors` | Several field errors are joined into one message. |

## Application startup (`BackendApplicationTests`)

This is the only backend test that starts the whole application with a real web server and nothing mocked.

| Test | Checks that |
| :--- | :--- |
| `contextLoads` | The application starts. |
| `reservationAvailabilityIsPublic` | `GET /api/reservations/availability` works over real HTTP without logging in. |
| `defaultStartupDataSupportsBookingWithoutCreatingTestTables` (parameterized) | Every party size from 1 to 10 can be booked with the default startup tables; parties up to 6 get one table, 7–10 get two. |

## Not yet tested

- Real HTTP behaviour (routes, JSON, request validation, security) for everything except the availability endpoint. Protected endpoints are not checked to reject anonymous users.
- `ReservationController`'s own time checks (`validateReservationTimes`), the 409 response when `create` or `update` (by ID) fails with `IllegalStateException`, availability with `to` before `from` or exactly 31 days, and `GET /api/reservations/stats`.
- `AuthController`, `ReceiptController`, `TestController` and `UserController` have no tests.
