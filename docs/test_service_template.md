# ReservationService Test Documentation

**Test Class:** `ReservationServiceTest.java`  
**Target Class:** `ReservationService.java`  
**Test Location:** `backend/src/test/java/com/pants/backend/service`  
**Test Type:** Unit test  
**Tech Stack:** JUnit 5, Mockito, AssertJ (Java 21)

## 1. Scope & Purpose

This suite verifies the reservation service's core unit-level behavior: creating reservations, assigning an available table, cancelling reservations through either an edit token or an ID, preventing updates to cancelled reservations, calculating availability, and updating an existing reservation.

The service is tested in isolation using Mockito. Repository and collaborating-service behavior is supplied by mocks, so this suite verifies how `ReservationService` responds to collaborator results and whether it requests the expected persistence operations. It does **not** verify actual database queries, entity mappings, database constraints, Spring dependency injection, or transaction rollback. Those concerns require integration tests.

The suite covers both successful operations and important validation failures. It also exposes a behavioral difference between cancellation by token and cancellation by ID: the token path rejects cancellation within one hour of the reservation, while the ID path is tested as allowing it.

## 2. Dependencies & Mocks

The test uses `@ExtendWith(MockitoExtension.class)`. Mockito creates the mocks and injects them into the service using `@InjectMocks`.

| Dependency | Test setup | Purpose in these tests |
| :--- | :--- | :--- |
| `ReservationRepository` | `@Mock` | Supplies reservations by ID or edit token, returns reservations for availability queries, and controls reservation saves. |
| `CustomerRepository` | `@Mock` | Controls customer persistence during reservation creation and update. |
| `RStatusRepository` | `@Mock` | Supplies the `CONFIRMED` status during creation/update and the cancelled status (ID `3`) during cancellation. |
| `TableService` | `@Mock` | Supplies available tables for creation and update; table-selection logic itself is outside this unit suite. |
| `TableListRepository` | `@Mock` | Verifies that a table-assignment link is saved after reservation creation. |
| `CancelService` | `@Mock` | Injected into the service, but no supplied test directly verifies an interaction with it. |
| `ReservationService` | `@InjectMocks` | Class under test; receives the mocked collaborators. |

`ArgumentCaptor<TableList>` is used to inspect the assignment created during reservation creation. `InOrder` verifies the relevant order of status lookup, table lookup, reservation save, and assignment save.

## 3. Test Data Preparation

* **Factories/helpers:** `reservation(status, datetime)` creates a reservation with ID `1`, edit token `test-token`, and a supplied status/date-time. `cancelledStatus()` creates a `CANCELLED` status with ID `3`. `reservationRequest()` uses `TestDataFactory.createReservationRequest(...)` with a fixed date, time range, party size, and email.
* **Setup:** Each test stubs only the repository/service calls relevant to its scenario. Mockito's JUnit extension initializes mocks for each test.
* **Determinism:** Most business inputs use fixed values (for example, 11 January 2027 for the creation request and 19 October 2026 for availability). Cancellation tests use `LocalDateTime.now()` with reservations two days or 30 minutes in the future. These tests therefore depend on the real system clock; the 30-minute cases are not boundary tests, but clock-dependent behavior could still be made more deterministic by injecting a `Clock` or using fixed timestamps relative to a controlled clock.

## 4. Test Case Matrix

| Service method | Test method | Scenario | Mock setup | Expected result or exception | Side effects / interactions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `createReservation` | `createReservation_assignsFirstAvailableTableAndUsesSavedReservationId` | A valid two-person reservation has two suitable tables available. | Confirmed status is returned; table service returns tables `7` and `8`; customer and reservation saves return their input, with reservation ID set to `42`. | Reservation is returned with ID `42`, confirmed status, customer details, party size/times, and a nonblank edit token. | Verifies status lookup → table lookup → reservation save → assignment save order. Captured assignment uses composite ID `(reservation 42, table 7)`, proving the first returned table is selected and the saved reservation ID is used. |
| `createReservation` | `createReservation_whenNoSuitableTableIsAvailable_doesNotSaveCustomerOrReservation` | No suitable table is available. | Confirmed status is returned; table service returns an empty list. | Throws `IllegalStateException`: `No suitable tables available for this reservation`. | No customer or table-link interactions; reservation is not saved. |
| `cancelReservationByToken` | `cancelByToken_whenConfirmed_setsStatusCancelled` | A confirmed reservation is cancelled using its edit token. | Token lookup returns the reservation; status ID `3` lookup returns cancelled status. | Returned reservation has cancelled status. | Reservation is saved. |
| `cancelReservationByToken` | `cancelByToken_whenTokenNotFound_throwsNoSuchElement` | Edit token does not exist. | Token lookup returns empty. | Throws `NoSuchElementException`: `Reservation not found`. | Reservation is not saved. |
| `cancelReservationByToken` | `cancelByToken_whenAlreadyCancelled_throwsIllegalState` | Reservation is already cancelled. | Token lookup returns a cancelled reservation. | Throws `IllegalStateException`: `Reservation is already cancelled`. | Reservation is not saved. |
| `cancelReservationByToken` | `cancelByToken_whenLessThanOneHourBefore_throwsIllegalState` | Reservation starts in 30 minutes. | Token lookup returns a confirmed reservation dated 30 minutes in the future. | Throws `IllegalStateException`: `Reservation can no longer be cancelled`. | Reservation is not saved. |
| `cancelReservation` | `cancelById_whenConfirmed_setsStatusCancelled` | A confirmed reservation is cancelled by numeric ID. | ID lookup returns the reservation; status ID `3` lookup returns cancelled status. | Returned reservation has cancelled status. | Reservation is saved. |
| `cancelReservation` | `cancelById_whenLessThanOneHourBefore_stillCancels` | Reservation starts in 30 minutes. | ID lookup returns a confirmed reservation; cancelled status is available. | Cancellation succeeds and returned reservation has cancelled status. | Reservation is saved through the service path. This contrasts with the one-hour restriction tested for token cancellation. |
| `cancelReservation` | `cancelById_whenNotFound_throwsNoSuchElement` | Reservation ID `99` does not exist. | ID lookup returns empty. | Throws `NoSuchElementException`: `Reservation not found`. | Reservation is not saved. |
| `cancelReservation` | `cancelById_whenAlreadyCancelled_throwsIllegalState` | Reservation is already cancelled. | ID lookup returns a cancelled reservation. | Throws `IllegalStateException`: `Reservation is already cancelled`. | Reservation is not saved. |
| `updateReservationByToken` | `updateByToken_whenCancelled_throwsIllegalState` | An edit-token update is attempted for a cancelled reservation. | Token lookup returns a cancelled reservation. | Throws `IllegalStateException`: `Cancelled reservations cannot be modified`. | Reservation is not saved. |
| `getReservationAvailability` | `getAvailability_countsOnlyActiveReservationsAtTheSameTime` | Same-date reservations include a confirmed booking at 10:00, a cancelled booking at 10:00, and a confirmed booking at 10:30. | Date-range query returns all three reservations. | First availability entry reports capacity `44`. | Confirms cancelled bookings and bookings at a different start time do not reduce the tested 10:00 capacity. |
| `getReservationAvailability` | `getAvailability_allowsMoreThanTenGuestsInOneSlot` | Two confirmed reservations at the same time have party sizes 10 and 8. | Date-range query returns both reservations. | First availability entry reports capacity `32`. | Demonstrates that the tested availability calculation does not impose a ten-guest aggregate limit. |
| `updateReservation` | `updateReservation_doesNotCountTheReservationBeingUpdated` | Existing six-person reservation is updated for the same date/time and party size. | ID lookup returns the existing reservation; status lookup returns confirmed; availability query includes the existing reservation; table service returns a suitable table; customer/reservation saves are stubbed. | Update succeeds and returns the same reservation object with party size `6`. | Confirms the reservation being updated is excluded from its own capacity calculation; the service requests a table using the existing reservation ID as an exclusion. |

## 5. Business Rules & Edge Cases

The tests directly verify these rules:

* New reservations use the `CONFIRMED` status.
* Creation asks `TableService` for suitable tables and assigns the first table returned.
* The table-assignment link is saved only after the reservation has been saved, and it uses the generated reservation ID.
* If no suitable table exists, creation fails before customer, reservation, or assignment persistence.
* A reservation can be cancelled by edit token or ID, provided it is not already cancelled.
* Cancellation of a missing reservation fails with `NoSuchElementException`.
* Token-based cancellation is rejected when the reservation is less than one hour away. ID-based cancellation is allowed in the tested 30-minute case.
* Cancelled reservations cannot be modified through the tested token update path.
* Availability calculation excludes cancelled reservations and counts only reservations at the same start time in the tested scenario.
* The tested availability calculation allows more than ten guests in one time slot.
* An existing reservation is excluded from availability calculations when that same reservation is being updated.

The suite does not establish the exact behavior at the one-hour cancellation boundary, nor does it test every possible status or date/time combination.

## 6. Coverage Gaps & Follow-up

Recommended follow-up work, based on the supplied test class:

* Add a successful `updateReservationByToken` test. The current token-update test covers only rejection of a cancelled reservation.
* Expand successful update coverage for changes to customer details, date, start/end time, party size, status, and table reassignment where those behaviors are part of the service contract.
* Add tests for any public deletion or other service methods not represented in this class. Deletion and assignment persistence are covered separately by the integration test, but not here.
* Test the exact one-hour cancellation boundary and a reservation exactly at the current time, using a controllable clock.
* Test missing `CONFIRMED` or `CANCELLED` status configuration and relevant repository/service failure paths.
* Add validation tests for null or invalid request fields if validation is owned by `ReservationService` rather than the DTO/controller layer.
* Add availability tests for empty result sets, date-range boundaries, and multiple reservations at the same start time with different statuses.

**Integration concerns not covered here:** actual repository query correctness, database constraints, Spring wiring, and transaction rollback. The separate `ReservationTableAssignmentIntegrationTest` addresses persistence and rollback behavior for table assignment.

## 7. Assessment

This is a focused unit suite for reservation creation, cancellation, and selected availability/update behavior. It gives useful confidence in the main creation flow, no-table failure handling, cancellation state checks, and the exclusion of the reservation being updated from availability calculations. Interaction-order and no-save assertions strengthen the tests by checking important side-effect constraints.

Coverage is incomplete for successful token-based updates and the broader update contract. Cancellation behavior differs between token and ID entry points and should be confirmed as intentional business behavior. The use of `LocalDateTime.now()` makes cancellation tests dependent on the real clock; a fixed/injected clock would improve repeatability. Database persistence and transactional behavior should be assessed using the integration suite rather than inferred from these mocks.

# ReservationTableAssignment Integration Test Documentation

**Test Class:** `ReservationTableAssignmentIntegrationTest.java`  
**Target Class:** `ReservationService.java` (with `TableService` and persistence collaborators)  
**Test Location:** `backend/src/test/java/com/pants/backend/service`  
**Test Type:** Spring Boot integration test  
**Tech Stack:** JUnit 5, Spring Boot Test, Spring Data JPA, H2, Mockito Spy, AssertJ (Java 21)

## 1. Scope & Purpose

This integration suite verifies reservation creation, table assignment, cancellation and reuse, reservation updates, deletion, and transaction rollback using a real Spring application context and an in-memory H2 database.

Unlike the Mockito unit tests, the service and repositories are real Spring-managed components. The tests verify persisted reservation/table-link state through repository queries. `TableListRepository` is wrapped with a Mockito spy only to simulate an assignment-save failure in the rollback scenario.

The suite therefore exercises service wiring, repository persistence, and transactional behavior in the configured test application. It does not independently prove behavior against the production database engine or production database schema/configuration; H2 may differ from the deployed database.

## 2. Dependencies & Mocks

The class uses `@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:tableassignmentdb")`.

| Dependency | Test setup | Purpose in these tests |
| :--- | :--- | :--- |
| `ReservationService` | `@Autowired` real Spring bean | Executes reservation creation, cancellation, update, and deletion logic. |
| `ReservationRepository` | `@Autowired` real repository | Reads persisted reservations and checks counts, existence, and flush behavior. |
| `CustomerRepository` | `@Autowired` real repository | Checks whether customer records are created or rolled back. |
| `TableRepository` | `@Autowired` real repository | Persists test tables and removes the temporary table in the rollback test. |
| `TableListRepository` | `@MockitoSpyBean` | Performs real assignment persistence in normal tests; allows `save(...)` to be forced to throw during rollback testing. |
| H2 datasource | Configured by `@SpringBootTest` property | Provides an in-memory relational database for integration testing. |

`@BeforeAll` deletes all table-assignment links and tables before the test class runs. Most tests use `@Transactional`, so their database changes are rolled back after each test. The rollback test deliberately has no test-level `@Transactional` annotation so it can verify the service transaction itself.

## 3. Test Data Preparation

* **Factories/helpers:** `table(capacity)` creates and persists a table using `TestDataFactory.createTable(capacity)` and assigns table number `900 + capacity`. `request(email, start, end)` creates a two-person reservation on 11 January 2027. `update(saved, dto, byToken)` routes an update through either the ID or edit-token API.
* **Setup:** `removeExampleTables(...)` runs once before the class and deletes all `TableList` rows before deleting tables, respecting the relationship between assignments and tables. Each test creates the tables and reservations it needs through the real service/repositories.
* **Parameterized setup:** The two update tests use `@ValueSource(booleans = {false, true})`; `false` exercises the ID-based update and `true` the edit-token update.
* **Failure simulation:** The rollback test uses `doThrow(new DataIntegrityViolationException(...))` on the spy's `save(TableList)` method.
* **Determinism:** Table capacities, email addresses, reservation date, and time windows are fixed. The test uses an in-memory database with a named H2 database URL. Test-level transactions isolate most test data through rollback; the explicit rollback test verifies that service-level transaction handling undoes earlier writes after assignment persistence fails.

## 4. Test Case Matrix

| Service method | Test method | Scenario | Mock setup | Expected result or exception | Side effects / interactions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `createReservation` | `assignsSmallestFreeTableAndRejectsOverlapsWhenAllTablesAreBooked` | A two-seat and four-seat table are available. Two overlapping reservations are created, followed by a third reservation that overlaps both occupied slots. | No mocked business collaborators; real Spring beans and H2 repositories are used. | First reservation receives the two-seat table; second receives the four-seat table; third creation throws `IllegalStateException`: `No suitable tables available for this reservation`. | Confirms assignment links are persisted for the expected reservation/table IDs. Failed third creation does not increase reservation count or persist the third customer's email. |
| `cancelReservation` | `cancelledReservationAllowsTheTableToBeAssignedAgain` | A reservation is created on a two-seat table and then cancelled. A replacement reservation requests the same time. | Real service and repositories. | Replacement reservation is created successfully. | Confirms the replacement reservation receives the previously occupied table, demonstrating that cancellation makes it available again. |
| `updateReservation` / `updateReservationByToken` | `updatingReservationKeepsItsOwnTableAndMovesToLargerTableWhenNeeded` (parameterized) | A two-seat reservation is updated without changing its size, then its party size is increased to four. | Real persistence; `byToken=false` and `byToken=true` run the ID and token paths. | Initial update succeeds and retains the small table. Increasing party size succeeds and uses the larger table. | Small-table assignment remains after the first update; after resizing, the small-table link is removed and the large-table link exists. Persisted party size is `4`. |
| `updateReservation` / `updateReservationByToken` | `updatingReservationRejectsAnOccupiedTableWithoutChangingTheOriginal` (parameterized) | An existing reservation is moved into a time slot already occupied by another reservation on the only available table. | Real persistence; both ID and token update paths are exercised. | Update throws `IllegalStateException`: `No suitable tables available for this reservation`. | Original start time remains 10:00 and original table assignment remains present; failed update does not replace the original booking state. |
| `deleteReservation` | `deletingReservationRemovesItsTableLink` | A reservation with a table assignment is deleted. | Real service and repositories; repository is flushed before assertions. | `deleteReservation(...)` returns `true`; reservation no longer exists. | The corresponding `TableList` assignment is also absent. |
| `createReservation` | `assignmentSaveFailureRollsBackTheReservationAndCustomer` | Assignment persistence is forced to fail after reservation/customer creation has begun. | Spy throws `DataIntegrityViolationException("Simulated assignment failure")` from `TableListRepository.save(...)`. | The same `DataIntegrityViolationException` propagates. | Reservation, customer, and assignment counts remain at their pre-operation values; customer email is absent. Temporary table is deleted in `finally`. This test has no test-level `@Transactional`, so it checks service transaction rollback rather than relying on automatic test rollback. |

## 5. Business Rules & Edge Cases

The integration tests directly verify these rules:

* A suitable free table is assigned when a reservation is created.
* When multiple suitable tables are available, the smallest suitable table is assigned first.
* Overlapping reservations cannot be assigned to an already occupied table.
* A failed creation caused by lack of table capacity does not persist the reservation or customer.
* Cancelling a reservation releases its table for a replacement reservation at the same time.
* Updating a reservation without increasing its needs retains its existing table.
* Increasing party size can cause the reservation to move to a larger table; the old assignment is removed and the new one persisted.
* Both ID-based and edit-token-based update paths are exercised for retaining/reassigning tables and rejecting conflicts.
* A failed update caused by an occupied table preserves the original reservation time and table assignment.
* Deleting a reservation also removes its table-assignment link.
* If saving the table-assignment link fails, the reservation and customer writes are rolled back by the service transaction.

The suite tests overlapping booking scenarios and persistence effects. It does not test simultaneous concurrent requests, production-database-specific locking, or every possible table-capacity combination.

## 6. Coverage Gaps & Follow-up

Recommended follow-up work:

* Add concurrent creation tests if the application must guarantee that two simultaneous requests cannot claim the same table. Such tests should use separate transactions/threads and verify the actual locking/isolation strategy.
* Run a smaller set of critical persistence/transaction tests against the production database engine, or otherwise validate that its constraints and locking behavior match H2.
* Add integration coverage for missing status configuration, invalid request data, and repository/database constraint failures if those are important production failure modes.
* Consider a test for updating the reservation's date/time while retaining or changing the table, not only changing party size and testing a conflicting time.
* Review the class-level database cleanup in `@BeforeAll`. `deleteAll()` is broad and assumes the H2 database is dedicated to this test context; avoid sharing the same named in-memory database with unrelated tests that rely on its contents.
* The rollback test's `finally` block deletes the temporary table. If cleanup itself fails, it could obscure the original assertion failure; this can be reviewed if test diagnostics become problematic.

**Unit-test gaps:** This class complements, rather than replaces, the focused unit tests. It does not exhaustively test every validation branch in `ReservationService` or `TableService`.

## 7. Assessment

This is a valuable integration suite because it verifies persisted table assignments and reservation state through real Spring-managed services and repositories. It covers the key lifecycle of an assignment: initial selection, conflict rejection, release after cancellation, retention/reassignment during updates, deletion, and rollback after a persistence failure.

The strongest test is `assignmentSaveFailureRollsBackTheReservationAndCustomer`, because it deliberately avoids test-level transaction rollback and checks that the service transaction restores database state after a collaborator failure. The parameterized update tests also ensure both public update routes follow the same assignment behavior.

The main limitations are the use of H2 rather than the production database, lack of concurrent booking tests, and broad one-time cleanup of tables/assignments. Subject to those limitations, the suite provides good integration-level confidence in reservation/table assignment persistence and transaction handling.

# TableService Test Documentation

**Test Class:** `TableServiceTest.java`  
**Target Class:** `TableService.java`  
**Test Location:** `backend/src/test/java/com/pants/backend/service`  
**Test Type:** Unit test  
**Tech Stack:** JUnit 5, Mockito, AssertJ (Java 21)

## 1. Scope & Purpose

This suite verifies table-capacity checks, selection of available tables, selection of combinations of tables for larger parties, and time/date overlap rules used to decide whether a table is available.

`TableService` is tested in isolation with Mockito. Repository responses and reservation/status data are controlled by mocks. The suite therefore verifies the service's decision-making given those results, but it does not verify actual repository query implementations, database relationships, persistence constraints, Spring wiring, or transaction behavior.

The suite has particularly strong coverage of reservation overlap boundaries, cancelled-reservation handling, missing linked reservations, and bulk loading of reservations associated with a table.

## 2. Dependencies & Mocks

The test uses `@ExtendWith(MockitoExtension.class)` and injects mocks into `TableService` using `@InjectMocks`.

| Dependency | Test setup | Purpose in these tests |
| :--- | :--- | :--- |
| `TableRepository` | `@Mock` | Supplies tables filtered by minimum capacity and all tables for combination selection. |
| `TableListRepository` | `@Mock` | Supplies reservation/table assignment links for a table. |
| `ReservationRepository` | `@Mock` | Supplies reservations associated with assignment IDs, including overlapping, non-overlapping, cancelled, or missing reservations. |
| `RStatusRepository` | `@Mock` | Supplies the cancelled status with ID `3`; also controls the missing-status configuration case. |
| `TableService` | `@InjectMocks` | Class under test; receives all mocked repositories. |

`stubCancelledStatus()` consistently configures the cancelled status as ID `3`. Mockito verifies that no reservation lookup is performed when a table has no assignments, and that multiple reservation IDs are loaded together using `findAllById(...)` rather than one lookup per ID.

## 3. Test Data Preparation

* **Factories/helpers:** `table(id, capacity)` delegates to `TestDataFactory.createTable(...)`. `assignment(reservationId, tableId)` delegates to `TestDataFactory.createTableList(...)`. `reservation(...)` delegates to `TestDataFactory.createReservation(...)`. `stubCancelledStatus()` creates a `CANCELLED` status with ID `3`.
* **Setup:** Tests use fixed dates (primarily 1 December 2026), fixed time ranges, and explicit table capacities and IDs. Each test stubs only the repository calls relevant to the scenario.
* **Parameterized data:** `@ValueSource` checks cancellation status-name variations and status IDs; `@CsvSource` checks seven time-overlap cases; `@NullSource` adds a null status ID to the non-cancelled-ID cases.
* **Determinism:** The supplied tests use fixed date/time values and do not call the system clock. This makes their time-boundary scenarios deterministic.

## 4. Test Case Matrix

| Service method | Test method | Scenario | Mock setup | Expected result or exception | Side effects / interactions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hasCapacityFor` | `hasCapacityFor_whenCapacityIsEnough_returnsTrue` | Table capacity is 6 and party size is 4. | No repository stubbing required. | Returns `true`. | Pure capacity decision; no repository interaction is required by the test. |
| `hasCapacityFor` | `hasCapacityFor_whenCapacityIsTooLow_returnsFalse` | Table capacity is 2 and party size is 4. | No repository stubbing required. | Returns `false`. | Pure capacity decision. |
| `findAvailableTables` | `findAvailableTables_whenSuitableTablesAreFree_returnsSmallestFirst` | Two-, four-, and six-person tables are all free for the requested period. | Capacity query returns the three tables in ascending capacity order. | Returns all three tables in the supplied smallest-first order. | Confirms the service returns suitable tables in the order supplied by the capacity-sorted repository query. |
| `findAvailableTables` | `findAvailableTables_whenSmallestTableIsBooked_returnsLargerAvailableTables` | Two-person table is booked during an overlapping period; larger tables are free. | Capacity query returns three tables; assignment points to reservation `10`; reservation overlaps; cancelled status ID `3` is configured. | Returns only the four- and six-person tables. | Confirms an overlapping booking excludes the assigned table from the available results. |
| `findAvailableTables` | `findAvailableTables_whenNoTablesHaveEnoughCapacity_returnsEmpty` | No table meets a party size of seven. | Capacity query returns an empty list. | Returns an empty list. | Verifies no assignment or reservation repository interactions occur when no table meets minimum capacity. |
| `findTableCombination` | `findTableCombination_whenPartyNeedsTwoTables_combinesLargestFreeTables` | Party size is 10; available capacities are 2, 4, 4, 6, and 6. | `findAll()` returns all five tables; no assignments are stubbed. | Returns table IDs `2` and `4` (capacities 4 and 6). | Confirms a two-table combination is selected using the largest capacities for this scenario. |
| `findTableCombination` | `findTableCombination_whenLargeTablesAreBooked_usesSmallerTables` | Party size is 8; the six-person table is booked, while two- and four-person tables are free. | All tables are returned; assignment/reservation stubs mark the six-person table as overlapping. | Returns table IDs `2` and `3` (two four-person tables). | Confirms unavailable large tables are excluded and smaller free tables can form a sufficient combination. |
| `findTableCombination` | `findTableCombination_finishesWithSmallestTableThatCoversTheRest` | Party size is 7; capacities are 2, 2, 6, and 6. | `findAll()` returns all four tables; no assignments are stubbed. | Returns table IDs `1` and `3` (capacities 2 and 6). | Confirms the tested selection finishes with a table that covers the remaining party capacity. |
| `findTableCombination` | `findTableCombination_whenFreeSeatsAreNotEnough_returnsEmpty` | Party size is 10, but total available capacity is only 6. | `findAll()` returns two- and four-person tables. | Returns an empty list. | Confirms no combination is returned when available capacity is insufficient. |
| `isAvailable` | `isAvailable_whenThereAreNoAssignments_returnsTrue` | Table has no reservation links. | Assignment lookup returns an empty list. | Returns `true`. | Verifies reservation repository is not accessed when there are no assignments. |
| `isAvailable` | `isAvailable_whenExistingReservationOverlapsSameDay_returnsFalse` | Existing reservation runs 18:30–20:30; requested time is 19:00–21:00 on the same day. | Assignment points to reservation `10`; reservation lookup returns the overlapping reservation; cancelled status ID `3` is configured. | Returns `false`. | Existing active reservation blocks the table. |
| `isAvailable` | `isAvailable_whenExistingReservationIsOnAnotherDay_returnsTrue` | Existing reservation is on 2 December; requested booking is on 1 December. | Assignment points to reservation `10`; reservation lookup returns the next-day reservation. | Returns `true`. | A booking on another date does not block the requested date/time. |
| `isAvailable` | `isAvailable_whenOverlappingReservationIsCancelled_returnsTrue` (parameterized) | Overlapping reservation has status name `CANCELLED`, `cancelled`, `CaNcElLeD`, or `RENAMED`, with status ID `3`. | Assignment and reservation are returned; cancelled status ID `3` is configured. | Returns `true` for all four inputs. | Demonstrates that the cancellation decision is based on status ID `3`, not the status name text. |
| `isAvailable` | `isAvailable_whenMultipleReservationsExist_loadsThemTogetherAndDetectsOverlap` | A table has two assignment links; one reservation is adjacent to the requested slot and another overlaps it. | Assignment lookup returns IDs `10` and `20`; `findAllById` returns both reservations. | Returns `false` because one reservation overlaps. | Verifies a single bulk `findAllById(List.of(10, 20))` call and verifies `findById(...)` is never used. |
| `isAvailable` | `isAvailable_whenAssignedReservationNoLongerExists_returnsTrue` | Assignment references reservation ID `10`, but no reservation is returned. | Assignment lookup returns the link; bulk reservation lookup returns an empty list. | Returns `true`. | A stale assignment whose reservation cannot be loaded does not block availability in this tested path. |
| `isAvailable` | `isAvailable_respectsOverlapBoundaries` (parameterized) | Requested slot is 19:00–21:00. Existing reservation windows are 17:00–19:00, 21:00–22:00, 18:00–20:00, 20:00–22:00, 18:00–22:00, 19:30–20:30, and 19:00–21:00. | Each invocation returns the corresponding reservation and configures cancelled status ID `3`. | Results respectively: `true`, `true`, `false`, `false`, `false`, `false`, `false`. | Confirms adjacent intervals that end at 19:00 or start at 21:00 are allowed, while actual overlaps—including equal start/end boundaries—are rejected. |
| `isAvailable` | `isAvailable_whenStatusNameIsCancelledButIdDiffers_returnsFalse` (parameterized) | Reservation name is `CANCELLED`, but status ID is `null`, `1`, `2`, or `4`. | Assignment and reservation are returned; cancelled status ID `3` is configured separately. | Returns `false` for all four inputs because the reservation's status ID is not `3` and its time overlaps. | Confirms status name alone does not make a reservation cancelled. |
| `isAvailable` | `isAvailable_whenStatusThreeIsMissing_throwsConfigurationError` | A table has an assignment, but the configured cancelled status record cannot be found. | Assignment lookup returns reservation ID `10`; lookup of status ID `3` returns empty. | Throws `IllegalStateException`: `Reservation status with ID 3 missing`. | Verifies missing required status configuration is surfaced as an explicit configuration error. |

## 5. Business Rules & Edge Cases

The tests directly verify these rules:

* A table has sufficient capacity when its capacity is at least the requested party size.
* Tables returned by the capacity query are considered in ascending capacity order.
* A table with an overlapping active reservation is unavailable.
* Reservations on another calendar date do not block the requested date.
* Adjacent reservations are allowed: an existing booking ending at the requested start, or starting at the requested end, is not an overlap.
* Partial overlaps, contained intervals, and identical intervals block availability.
* A reservation with status ID `3` is treated as cancelled and does not block the table, regardless of the status name string.
* A status name of `CANCELLED` with an ID other than `3` (or a null ID) is not treated as cancelled.
* A table with no assignment links is immediately considered available without loading reservations.
* Multiple assigned reservations are loaded in one bulk repository call.
* An assignment pointing to a reservation that cannot be loaded does not block availability in the tested path.
* Missing the configured cancelled status with ID `3` produces an `IllegalStateException`.
* Table combination selection can use multiple free tables, excludes a booked large table in the tested scenario, and returns empty when total free capacity is insufficient.

## 6. Coverage Gaps & Follow-up

Recommended follow-up work:

* Add tests for empty `TableRepository.findAll()` results and for party sizes at exact capacity boundaries.
* Add combination-selection cases with three or more tables, equal-capacity alternatives, and multiple combinations that can satisfy the party size. The current tests cover representative two-table combinations, not every optimization/tie-breaking possibility.
* Add tests for zero or negative party sizes if those values can reach `TableService`; otherwise document that validation is enforced before this service is called.
* Add tests for repository exceptions or unexpected null data if the service is expected to handle those failures.
* Add explicit tests for date/time edge cases such as reservations crossing midnight, if overnight bookings are supported.
* Confirm and document the intended behavior for stale `TableList` links. The current test establishes that a missing referenced reservation does not block availability, but does not verify cleanup of the stale link.
* Verify the actual repository query ordering and assignment lookup behavior in a repository/integration test; this unit suite stubs those results.

## 7. Assessment

This is a strong, focused unit suite for table availability and selection logic. It covers capacity checks, available-table filtering, multi-table combinations, same-day overlap detection, adjacent interval boundaries, cancelled-status identification, missing related reservations, and missing status configuration. The parameterized tests add useful breadth without duplicating test methods.

The suite is deterministic because it uses fixed date/time values. Its main limitations are that repository behavior is mocked and combination selection is tested with a limited set of representative arrangements. Additional tests for tie-breaking, larger combinations, invalid party sizes, and date rollover would strengthen confidence if those scenarios are part of the supported business contract. Database mapping, query correctness, and transactional behavior should be covered by integration tests.
