# Backend Test Documentation

**Test Location:** `backend/src/test/java/com/pants/backend`

**Tech Stack:** JUnit 5, Mockito, AssertJ, Spring Boot Test (Java 21)

## 1. Scope & Purpose

The backend test suite covers three levels:

* **Service unit tests** exercise reservation and table business rules with mocked repositories. They do not connect to a database.
* **Controller unit tests** call controller methods directly with mocked services or repositories. They check response bodies and status codes, but do not exercise Spring MVC routing, JSON serialization, or HTTP request binding.
* **Application smoke tests** start the Spring application on a random port and check that the application context loads and the reservation-availability endpoint is publicly accessible.

These tests provide focused coverage of important service rules and controller outcomes. They are not a full end-to-end verification of persistence or HTTP behavior.

## 2. Dependencies & Mocks

The isolated service and controller tests use `@ExtendWith(MockitoExtension.class)`, `@Mock`, and `@InjectMocks`.

| Test class | Mocked dependencies | Test subject |
| :--- | :--- | :--- |
| `ReservationServiceTest` | `ReservationRepository`, `CustomerRepository`, `RStatusRepository` | `ReservationService` |
| `TableServiceTest` | `TableListRepository`, `ReservationRepository` | `TableService` |
| `CustomerControllerTest` | `CustomerRepository` | `CustomerController` |
| `ReservationControllerTest` | `ReservationService` | `ReservationController` |
| `TableControllerTest` | `TableRepository` | `TableController` |
| `TableListControllerTest` | `TableListRepository`, `ReservationRepository`, `TableRepository`, `TableService` | `TableListController` |

`BackendApplicationTests` is different: it uses `@SpringBootTest` with a random server port and a real application context.

## 3. Test Data Preparation

Tests primarily construct small entities and DTOs with class-local helper methods, such as `reservation(...)`, `reservationDto(...)`, `createCustomer()`, and `validDto()`. `TestDataFactory` provides shared factories for tables, reservations, and table assignments; it is used by the reservation and table-list controller tests. Service tests mostly use their own helpers.

Mockito stubs repository/service responses for each scenario. There is no shared `@BeforeEach` fixture setup in the two service test classes.

## 4. Test Case Matrix

### Service Tests — ReservationService

| Behavior | Test method(s) | Dependency setup | Expected result / assertions |
| :--- | :--- | :--- | :--- |
| Cancel a confirmed reservation | `cancelByToken_whenConfirmed_setsStatusCancelled` | Token lookup finds a confirmed reservation; cancelled status is available | Returned reservation has `CANCELLED` status and is saved |
| Cancel with missing or ineligible reservation | `cancelByToken_whenTokenNotFound_throwsNoSuchElement`; `cancelByToken_whenAlreadyCancelled_throwsIllegalState`; `cancelByToken_whenLessThanOneHourBefore_throwsIllegalState` | Missing token, cancelled status, or reservation 30 minutes away | Expected exception and no save |
| Update a cancelled reservation by token | `updateByToken_whenCancelled_throwsIllegalState` | Token lookup returns a cancelled reservation | `IllegalStateException`; no save |
| Create with insufficient slot capacity | `create_whenSlotCapacityWouldBeExceeded_throwsIllegalState` | Existing confirmed reservation consumes capacity | Capacity exception; customer is not saved |
| Create within slot capacity | `create_whenSlotHasCapacity_savesReservation` | No existing customer; repositories return saved records | Created reservation has the requested party size and `CONFIRMED` status |
| Update by token within slot capacity | `updateByToken_updatesReservationWithinSlotCapacity` | Existing reservation and related customer are returned | Updated party size is applied |
| Calculate availability for an empty date | `getAvailability_includesSlotsWithoutReservationsWithTenGuestsAvailable` | No repository data is needed | Returns 15 slots; first starts at 10:00 and every slot has capacity 10 |
| Subtract active reservations from availability | `getAvailability_subtractsGuestsFromActiveReservationsInMatchingSlot` | One confirmed and one cancelled reservation in the date range | Matching slot reflects active guests only; next slot remains at full capacity |

### Service Tests — TableService

| Behavior | Test method(s) | Dependency setup | Expected result / assertions |
| :--- | :--- | :--- | :--- |
| Check table capacity | `hasCapacityFor_whenCapacityIsEnough_returnsTrue`; `hasCapacityFor_whenCapacityIsTooLow_returnsFalse` | Construct table with capacity above or below the party size | Returns the corresponding boolean |
| Check availability with no assignments | `isAvailable_whenThereAreNoAssignments_returnsTrue` | Assignment lookup returns an empty list | Returns `true` |
| Reject an overlapping reservation on the same day | `isAvailable_whenExistingReservationOverlapsSameDay_returnsFalse` | Assigned reservation overlaps the requested interval | Returns `false` |
| Allow a reservation on another day | `isAvailable_whenExistingReservationIsOnAnotherDay_returnsTrue` | Assigned reservation is on the next day | Returns `true` |

### Controller Tests

Controller unit tests invoke controller methods directly; the expected HTTP status below refers to the returned `ResponseEntity`, not an actual HTTP exchange.

| Test class | Covered cases |
| :--- | :--- |
| `CustomerControllerTest` | List and get customers (found/empty or missing); create and update valid customers; reject missing/blank required fields via parameterized cases; translate duplicate-email persistence errors; delete existing and missing customers |
| `ReservationControllerTest` | List reservations; return availability and reject oversized date ranges without calling the service; get by ID/token; create and update by ID/token; cancel by token; delete; map missing, invalid, and disallowed-operation exceptions to response statuses |
| `TableControllerTest` | List/get tables; create, update, and delete success paths; return not-found responses; translate repository create errors |
| `TableListControllerTest` | List/get assignments; validate referenced reservation and table; reject duplicate assignments, insufficient capacity, or unavailable time slots; create valid assignments; delete found/missing assignments |

### Application Smoke Tests

| Test method | Setup | Assertion |
| :--- | :--- | :--- |
| `contextLoads` | Full Spring context with random web port | Application context starts |
| `reservationAvailabilityIsPublic` | Sends a real GET request to `/api/reservations/availability` | HTTP status is `200` |

## 5. Key Edge Cases & Coverage Gaps

### Business rules covered

* Reservation cancellation by token: missing token, already-cancelled state, and a reservation less than one hour away.
* Reservation slot capacity: a capacity failure prevents customer persistence; a successful creation and token-based update are exercised.
* Availability calculation ignores cancelled reservations when subtracting guest counts.
* Table assignment checks cover insufficient capacity and a same-day overlap.
* Controller tests cover not-found, invalid-input, conflict, and prevention of persistence on selected failure paths.

### Gaps to consider

* `ReservationService` has no direct tests for `getAllReservations`, `getReservationById`, `getReservationByToken`, `updateReservation`, or `deleteReservation` (although token lookup is exercised indirectly by cancellation and update-by-token tests).
* `EmailService`, `ReceiptService`, and `UserDetailsService` currently have no dedicated unit tests.
* `TableService` would benefit from tests for adjacent/non-overlapping intervals, cancelled assignments, and assignments whose reservation lookup is missing.
* Reservation service tests do not cover the exact one-hour cancellation boundary or several failure paths in create/update flows.
* The controller tests do not verify actual route mapping, request/response JSON, Spring validation, filters, or security behavior. Add MVC-slice or HTTP integration tests for those concerns if they are part of the required contract.
* Some reservation service tests use `LocalDateTime.now()`, which makes their timing dependent on when the suite runs. Fixed clock/time values would make boundary tests deterministic.

## 6. Is This Template Suitable for Service Tests?

**Not as written.** The original template is controller-specific: it describes `@WebMvcTest`, `@MockBean`, endpoints, HTTP status codes, JSON serialization, and controller-level validation. Those assumptions do not match the backend's current controller tests either, which use Mockito to call controller methods directly.

For service tests, retain the purpose, dependency, test-data, case-matrix, and edge-case sections, but change the matrix columns to **service method**, **scenario**, **mocked dependency behavior**, **expected return value or exception**, and **side effects/interactions**. Do not use endpoint or HTTP-status columns unless documenting a separate web-layer test. The two current service suites are a useful focused start, but the gaps above mean they are not yet comprehensive service coverage.
