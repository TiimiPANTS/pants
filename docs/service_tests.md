# Backend service tests

The service tests are in [`backend/src/test/java/com/pants/backend/service`](../backend/src/test/java/com/pants/backend/service). They use JUnit 6, Mockito and AssertJ.

There are two kinds:

- **Unit tests** (`ReservationServiceTest`, `TableServiceTest`) mock all repositories, so they test only the service's own logic.
- **Integration test** (`ReservationTableAssignmentIntegrationTest`) runs the real services and repositories against an in-memory H2 database, so it also checks what is actually saved and that failed operations are rolled back.

To run the backend tests, see the README.

## ReservationService

`ReservationServiceTest` (unit)

| Test | Checks that |
| :--- | :--- |
| `createReservation_assignsFirstAvailableTableAndUsesSavedReservationId` | A new reservation is confirmed, gets an edit token, and is linked to the first free table; the reservation is saved before the table link. |
| `createReservation_whenNoSuitableTableIsAvailable_doesNotSaveCustomerOrReservation` | With no free table, creation fails and nothing is saved. |
| `cancelByToken_whenConfirmed_setsStatusCancelled` | Cancelling by edit token sets the status to cancelled. |
| `cancelByToken_whenTokenNotFound_throwsNoSuchElement` | An unknown token fails. |
| `cancelByToken_whenAlreadyCancelled_throwsIllegalState` | An already cancelled reservation can't be cancelled again. |
| `cancelByToken_whenLessThanOneHourBefore_throwsIllegalState` | Customers can't cancel less than an hour before the reservation. |
| `cancelById_whenConfirmed_setsStatusCancelled` | Cancelling by ID sets the status to cancelled. |
| `cancelById_whenLessThanOneHourBefore_stillCancels` | Staff (cancelling by ID) can still cancel within the last hour. |
| `cancelById_whenNotFound_throwsNoSuchElement` / `cancelById_whenAlreadyCancelled_throwsIllegalState` | A missing or already cancelled reservation fails. |
| `updateByToken_whenCancelled_throwsIllegalState` | A cancelled reservation can't be edited. |
| `getAvailability_countsOnlyActiveReservationsAtTheSameTime` | Cancelled reservations and reservations at other times don't reduce a slot's capacity. |
| `getAvailability_allowsMoreThanTenGuestsInOneSlot` | A time slot can hold more than ten guests in total. |
| `updateReservation_doesNotCountTheReservationBeingUpdated` | When updating, the service leaves the reservation itself out of the table search. |

**Notes**

- The cancellation tests use `LocalDateTime.now()` in the computer's time zone, but the service uses Helsinki time. On a computer more than 30 minutes ahead of Helsinki (for example UTC+7), `cancelByToken_whenLessThanOneHourBefore_throwsIllegalState` fails. Using Helsinki time in the test, or an injected `Clock`, would fix this.
- `updateReservation_doesNotCountTheReservationBeingUpdated` would pass even if the reservation were counted against itself, because the slot holds 50 guests. A party larger than 25 would make it a real test.
- The service checks "cancelled" in two ways: cancellation looks at status ID `3`, while availability and updates compare the status name to `"CANCELLED"`. This should be made consistent.

## TableService

`TableServiceTest` (unit)

| Test | Checks that |
| :--- | :--- |
| `hasCapacityFor_whenCapacityIsEnough_returnsTrue` / `hasCapacityFor_whenCapacityIsTooLow_returnsFalse` | A table fits a party only if it has enough seats. |
| `findAvailableTables_whenSuitableTablesAreFree_returnsSmallestFirst` | Free tables that fit are returned smallest first. |
| `findAvailableTables_whenSmallestTableIsBooked_returnsLargerAvailableTables` | A booked table is left out. |
| `findAvailableTables_whenNoTablesHaveEnoughCapacity_returnsEmpty` | Nothing is returned when no table is big enough. |
| `findTableCombination_whenPartyNeedsTwoTables_combinesLargestFreeTables` | A party of 10 gets the largest free table (6) plus the smallest table that covers the rest (4). |
| `findTableCombination_whenLargeTablesAreBooked_usesSmallerTables` | Booked large tables are skipped and smaller free tables are combined. |
| `findTableCombination_finishesWithSmallestTableThatCoversTheRest` | A party of 7 gets a 6-seat and a 2-seat table. |
| `findTableCombination_whenFreeSeatsAreNotEnough_returnsEmpty` | Nothing is returned when all free tables together are too small. |
| `isAvailable_whenThereAreNoAssignments_returnsTrue` | A table with no bookings is free. |
| `isAvailable_whenExistingReservationOverlapsSameDay_returnsFalse` | An overlapping booking on the same day makes the table busy. |
| `isAvailable_whenExistingReservationIsOnAnotherDay_returnsTrue` | A booking on another day doesn't. |
| `isAvailable_respectsOverlapBoundaries` (parameterized) | Back-to-back bookings (ending at 19:00 or starting at 21:00 for a 19:00–21:00 request) are allowed; any real overlap is not. |
| `isAvailable_whenOverlappingReservationIsCancelled_returnsTrue` (parameterized) | A booking with status ID `3` counts as cancelled, whatever its status name. |
| `isAvailable_whenStatusNameIsCancelledButIdDiffers_returnsFalse` (parameterized) | A status named `CANCELLED` with a different ID does not count as cancelled. |
| `isAvailable_whenMultipleReservationsExist_loadsThemTogetherAndDetectsOverlap` | Several bookings are loaded in one database call. |
| `isAvailable_whenAssignedReservationNoLongerExists_returnsTrue` | A link to a deleted reservation doesn't block the table. |
| `isAvailable_whenStatusThreeIsMissing_throwsConfigurationError` | A missing cancelled status (ID `3`) in the database gives a clear error. |

## Reservations and tables together

`ReservationTableAssignmentIntegrationTest` (integration, H2)

| Test | Checks that |
| :--- | :--- |
| `assignsSmallestFreeTableAndRejectsOverlapsWhenAllTablesAreBooked` | The smallest free table is used first, then the next one; when all are booked, creation fails and nothing is saved. |
| `cancelledReservationAllowsTheTableToBeAssignedAgain` | Cancelling frees the table for a new booking at the same time. |
| `updatingReservationKeepsItsOwnTableAndMovesToLargerTableWhenNeeded` (parameterized: by ID and by token) | An update keeps the same table, and moves to a larger table when the party grows. |
| `updatingReservationRejectsAnOccupiedTableWithoutChangingTheOriginal` (parameterized: by ID and by token) | Moving to a fully booked time fails and the original booking stays as it was. |
| `deletingReservationRemovesItsTableLink` | Deleting a reservation also deletes its table link. |
| `assignmentSaveFailureRollsBackTheReservationAndCustomer` | If saving the table link fails, the reservation and customer are not saved either. |

## Not yet tested

- `ReservationService`: a successful update by token, the one-hour limit on editing, combining several tables when no single table fits, the "not enough capacity" error, input validation in `validate()`, the cancellation email, the exact one-hour boundary, weekend opening hours, and `getWeeklyStats`, `getAllReservations`, `getReservationById`, `getReservationByToken` and `deleteReservation`.
- `TableService`: the variants that skip the reservation being updated (only tested through the integration test), missing start or end times, and larger or tied table combinations.
- Integration: two bookings made at the same moment, and running against PostgreSQL instead of H2.
