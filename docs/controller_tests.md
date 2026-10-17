# Backend Controller Test Documentation

**Test Location:** `backend/src/test/java/com/pants/backend/controller`

**Tech Stack:** JUnit 5, Mockito, AssertJ (Java 21)

## 1. Scope & Purpose

These tests check controller response behavior for customer, reservation, table, and table-assignment operations. They verify the returned `ResponseEntity` status and body and, where relevant, the interaction with a mocked repository or service.

The tests instantiate controllers with Mockito using `@InjectMocks` and invoke their methods directly. They are controller unit tests, not Spring MVC tests: they do not send HTTP requests and do not exercise route mapping, JSON serialization, request binding, validation filters, or security configuration.

## 2. Dependencies & Mocks

The controller test classes use `@ExtendWith(MockitoExtension.class)`, `@Mock`, and `@InjectMocks`.

| Test class | Mocked dependencies | Controller under test |
| :--- | :--- | :--- |
| `CustomerControllerTest` | `CustomerRepository` | `CustomerController` |
| `ReservationControllerTest` | `ReservationService` | `ReservationController` |
| `TableControllerTest` | `TableRepository` | `TableController` |
| `TableListControllerTest` | `TableListRepository`, `ReservationRepository`, `TableRepository`, `TableService` | `TableListController` |

The repository-backed controllers are tested with repository mocks; `ReservationController` delegates to a mocked service. For table assignments, the repository mocks supply reservation, table, and assignment lookups, while `TableService` supplies capacity and availability results.

## 3. Test Data Preparation

Tests use small entities and DTOs created by local helper methods, including `createCustomer()`, `validDto()`, and `createReservation()`. `TableListControllerTest` also uses the shared `TestDataFactory` for reservations, tables, and table assignments. Stubs are generally configured inside each test to make the scenario-specific behavior explicit.

`CustomerControllerTest` uses the `invalidCustomers` method source to check null, empty, and whitespace-only first name, last name, and email values for create and update. Reservation tests use fixed date/time inputs for normal scenarios.

## 4. Test Case Matrix

The paths below document the controller mappings. Expected statuses are asserted from the returned `ResponseEntity`; they are not statuses observed from an HTTP client.

### CustomerController

**Base path:** `/api/customers`

| Endpoint | Test method(s) | Scenario | Mock setup | Expected status | Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/customers` | `getAll_whenCustomersExist_returnsOk` | Customers exist | `findAll()` returns two customers | `200 OK` | Checks list size and mapped DTO fields |
| `GET /api/customers` | `getAll_whenNoCustomers_returnsNotFound` | No customers exist | `findAll()` returns empty list | `404 NOT_FOUND` | Checks `ErrorResponse` status and message |
| `GET /api/customers/{id}` | `getById_whenExists_returnsOk` | Requested customer exists | `findById()` returns customer | `200 OK` | Checks mapped customer DTO |
| `GET /api/customers/{id}` | `getById_whenNotExists_returnsNotFound` | ID is missing | `findById()` returns empty | `404 NOT_FOUND` | Checks `ErrorResponse` |
| `POST /api/customers` | `create_withValidData_returnsCreated` | Valid customer data | `save()` returns a customer | `201 CREATED` | Checks response DTO and captured entity values |
| `POST /api/customers` | `create_withInvalidData_returnsBadRequest` (parameterized) | First name, last name, or email is null/blank | No repository setup | `400 BAD_REQUEST` | Checks field-specific error; verifies no save |
| `POST /api/customers` | `create_whenRepositoryThrows_returnsBadRequest` | Persistence reports duplicate email | `save()` throws `DataIntegrityViolationException` | `400 BAD_REQUEST` | Checks translated error response |
| `PUT /api/customers/{id}` | `update_withValidData_returnsOk` | Customer exists and input is valid | `findById()` and `save()` return existing entity | `200 OK` | Checks updated DTO fields and save |
| `PUT /api/customers/{id}` | `update_whenNotExists_returnsNotFound`; `update_whenNotExistsAndInvalidData_returnsNotFound` | Customer ID is missing, including when data is invalid | `findById()` returns empty | `404 NOT_FOUND` | Checks not-found response; missing-customer case takes precedence over validation |
| `PUT /api/customers/{id}` | `update_withInvalidData_returnsBadRequest` (parameterized) | First name, last name, or email is null/blank for an existing customer | `findById()` returns customer | `400 BAD_REQUEST` | Checks field-specific error and no save |
| `DELETE /api/customers/{id}` | `delete_whenExists_returnsOk` | Customer exists | `existsById()` returns `true` | `200 OK` | Checks success message and `deleteById()` |
| `DELETE /api/customers/{id}` | `delete_whenNotExists_returnsNotFound` | Customer is missing | `existsById()` returns `false` | `404 NOT_FOUND` | Checks error response and no delete |

### ReservationController

**Base path:** `/api/reservations`

| Endpoint | Test method(s) | Scenario | Mock setup | Expected status | Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/reservations` | `getAll_whenReservationsExist_returnsOk`; `getAll_whenNoReservations_returnsOkWithEmptyList` | Reservations exist or list is empty | Service returns populated or empty list | `200 OK` | Checks returned records or empty list |
| `GET /api/reservations/availability?from=...&to=...` | `getAvailability_returnsOnlyAvailabilityData` | Valid one-day range | Service returns availability DTOs | `200 OK` | Checks body and available capacity |
| `GET /api/reservations/availability?from=...&to=...` | `getAvailability_whenRangeExceedsLimit_returnsBadRequest` | Range exceeds 32 days | No service setup | `400 BAD_REQUEST` | Checks service has no interactions |
| `GET /api/reservations/{id}` | `getById_whenExists_returnsOk`; `getById_whenNotExists_returnsNotFound` | Reservation exists or service returns `null` | Service returns reservation or `null` | `200 OK` / `404 NOT_FOUND` | Checks body or error response |
| `GET /api/reservations/manage/{token}` | `getByToken_whenExists_returnsOk`; `getByToken_whenNotExists_returnsNotFound` | Token resolves or lookup throws `NoSuchElementException` | Service returns reservation or throws | `200 OK` / `404 NOT_FOUND` | Checks `ReservationResponse` including edit token, or error response |
| `POST /api/reservations` | `create_withValidData_returnsCreated`; `create_withInvalidData_returnsBadRequest` | Valid request or service rejects input | Service returns reservation or throws `IllegalArgumentException` | `201 CREATED` / `400 BAD_REQUEST` | Checks response wrapper/token or error response |
| `PUT /api/reservations/{id}` | `update_withValidData_returnsOk`; `update_whenNotExists_returnsNotFound`; `update_withInvalidData_returnsBadRequest` | Update succeeds, target is missing, or input is invalid | Service returns reservation or throws `NoSuchElementException` / `IllegalArgumentException` | `200 OK` / `404 NOT_FOUND` / `400 BAD_REQUEST` | Checks response body or mapped error |
| `PUT /api/reservations/manage/{token}` | `updateByToken_withValidData_returnsOk`; `updateByToken_whenNotExists_returnsNotFound`; `updateByToken_withInvalidData_returnsBadRequest`; `updateByToken_whenModificationNotAllowed_returnsConflict` | Token update succeeds, token missing, input invalid, or modification disallowed | Service returns reservation or throws the corresponding exception | `200 OK` / `404 NOT_FOUND` / `400 BAD_REQUEST` / `409 CONFLICT` | Checks response wrapper/token or error response |
| `PATCH /api/reservations/manage/{token}/cancel` | `cancelByToken_whenExists_returnsOk`; `cancelByToken_whenNotExists_returnsNotFound`; `cancelByToken_whenAlreadyCancelled_returnsConflict`; `cancelByToken_whenTooLate_returnsConflict` | Cancellation succeeds, token missing, already cancelled, or too late | Service returns cancelled reservation or throws `NoSuchElementException` / `IllegalStateException` | `200 OK` / `404 NOT_FOUND` / `409 CONFLICT` | Checks cancelled state/token or mapped error |
| `DELETE /api/reservations/{id}` | `delete_whenExists_returnsOk`; `delete_whenNotExists_returnsNotFound` | Delete succeeds or service reports no reservation | `deleteReservation()` returns `true` or `false` | `200 OK` / `404 NOT_FOUND` | Checks success message or not-found response |

### TableController

**Base path:** `/api/tables`

| Endpoint | Test method(s) | Scenario | Mock setup | Expected status | Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/tables` | `getAll_whenTablesExist_returnsOk`; `getAll_whenNoTablesExist_returnsNotFound` | Tables exist or list is empty | `findAll()` returns records or empty list | `200 OK` / `404 NOT_FOUND` | Checks response list or error response |
| `GET /api/tables/{id}` | `getById_whenFound_returnsOk`; `getById_whenNotFound_returnsNotFound` | Table exists or is missing | `findById()` returns table or empty | `200 OK` / `404 NOT_FOUND` | Checks table or error response |
| `POST /api/tables` | `create_whenValid_returnsCreated`; `create_whenRepositoryThrows_returnsBadRequest` | Save succeeds or repository throws | `save()` returns table or throws | `201 CREATED` / `400 BAD_REQUEST` | Checks saved table or translated error |
| `PUT /api/tables/{id}` | `update_whenFound_returnsOk`; `update_whenNotFound_returnsNotFound` | Table exists or is missing | `findById()` returns table or empty; save is stubbed on success | `200 OK` / `404 NOT_FOUND` | Checks updated table number/capacity; verifies no save when missing |
| `DELETE /api/tables/{id}` | `delete_whenFound_returnsOk`; `delete_whenNotFound_returnsNotFound` | Table exists or is missing | `existsById()` returns `true` or `false` | `200 OK` / `404 NOT_FOUND` | Checks success message/delete or verifies no delete |

### TableListController

**Base path:** `/api/tablelists`

| Endpoint | Test method(s) | Scenario | Mock setup | Expected status | Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/tablelists` | `getAll_whenTableListsExist_returnsOk`; `getAll_whenNoTableListsExist_returnsNotFound` | Assignments exist or list is empty | `findAll()` returns a list or empty list | `200 OK` / `404 NOT_FOUND` | Checks assignment list or error response |
| `GET /api/tablelists/{reservationId}/{tableId}` | `getById_whenFound_returnsOk`; `getById_whenNotFound_returnsNotFound` | Composite key exists or is missing | `findById()` returns assignment or empty | `200 OK` / `404 NOT_FOUND` | Checks assignment or error response |
| `POST /api/tablelists` | `create_whenReservationMissing_returnsNotFound` | Referenced reservation is missing | Reservation lookup returns empty | `404 NOT_FOUND` | Checks error and no table lookup or assignment save |
| `POST /api/tablelists` | `create_whenTableMissing_returnsNotFound` | Referenced reservation exists, table is missing | Reservation lookup returns a record; table lookup returns empty | `404 NOT_FOUND` | Checks error and no assignment save |
| `POST /api/tablelists` | `create_whenAlreadyExists_returnsBadRequest` | Composite-key assignment already exists | Parent records exist; `existsById()` returns `true` | `400 BAD_REQUEST` | Checks duplicate error and no save |
| `POST /api/tablelists` | `create_whenCapacityTooSmall_returnsBadRequest` | Table capacity is below party size | Parent records exist; assignment absent; capacity check returns `false` | `400 BAD_REQUEST` | Checks capacity error and no save |
| `POST /api/tablelists` | `create_whenUnavailable_returnsConflict` | Table is occupied for the reservation time | Parents exist; capacity passes; availability returns `false` | `409 CONFLICT` | Checks conflict error and no save |
| `POST /api/tablelists` | `create_whenValid_returnsCreated` | Reservation and table are valid, assignment is new, capacity and availability pass | Mocks return parent records, `false` for existing assignment, `true` for capacity/availability, and saved assignment | `201 CREATED` | Checks returned assignment and save |
| `DELETE /api/tablelists/{reservationId}/{tableId}` | `delete_whenFound_returnsOk`; `delete_whenNotFound_returnsNotFound` | Composite-key assignment exists or is missing | `existsById()` returns `true` or `false` | `200 OK` / `404 NOT_FOUND` | Checks delete on success or not-found response |

## 5. Key Edge Cases & Business Rules Validated

* Customer creation and update reject null, empty, and whitespace-only required fields; invalid input does not persist.
* Updating a missing customer returns not-found before validating the submitted DTO.
* Reservation availability rejects overlong date ranges before calling the service. The controller also guards against reversed ranges, but that case is not directly covered by the current tests.
* Reservation controller maps missing-resource, invalid-input, and disallowed-state exceptions to not-found, bad-request, and conflict responses.
* Table assignment creation checks parent existence, duplicate composite key, table capacity, and time availability in sequence; failure cases prevent assignment persistence.
* Table and customer delete paths distinguish existing from missing records.

## 6. Coverage Gaps & Follow-up

* These unit tests do not prove the declared HTTP mappings, request/response JSON shape, path/query parameter binding, or Spring MVC validation. Add focused `@WebMvcTest` tests or HTTP integration tests for those requirements.
* `ReservationControllerTest` does not currently exercise `createReservation` when the service throws `IllegalStateException` (the controller maps this to `409 CONFLICT`).
* Availability tests cover a valid range and an overlong range, but do not directly cover `to` before `from` or the exact maximum 32-day boundary.
* The controller test directory has no matching test classes for `AuthController`, `ReceiptController`, `TestController`, or `UserController`.
* The tests use mocks in place of persistence and service implementations, so repository query behavior, transaction behavior, application wiring, and security filters are outside their scope.

## 7. Assessment

The current suites provide a useful focused check of controller decision branches and response construction, especially for not-found, invalid-input, and conflict cases. They are suitable as controller unit tests, but not sufficient by themselves to verify the API's externally observable HTTP contract. Keep the direct unit tests for fast branch coverage and add MVC or integration tests for routes, serialization, validation, and security as needed.
