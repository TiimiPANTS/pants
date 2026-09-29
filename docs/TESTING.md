# [ControllerName] Test Documentation

**Test Class:** `[ControllerName]Test.java`

**Target Class:** `[ControllerName].java`

**Tech Stack:** JUnit 5, Mockito, Spring MockMvc (Java 21)

## 1. Scope & Purpose
This test suite validates the web layer of the `[ControllerName]`. It ensures that HTTP routing, JSON serialization/deserialization, and HTTP status codes function correctly. By isolating the controller using `@WebMvcTest` and `@MockBean`, these tests verify that the controller correctly interprets business logic outcomes (e.g., successful creation, capacity conflicts, missing resources) without executing actual database queries or launching the full Spring application context.

---

## 2. Dependencies & Mocks
The following service layer dependencies are mocked to strictly isolate the controller's HTTP routing behavior:

*   **`[ServiceName]` (`@MockBean`):** Intercepts business logic calls.
    *   *Example:* Mocking `ReservationService` to bypass the `reservationRepository.save()` execution.
*   **`[SecondaryServiceName]` (`@MockBean`):** (If applicable). 
    *   *Example:* Mocking `TableService` to simulate `hasCapacityFor()` or time slot `overlaps()` calculations.

---

## 3. Test Data Preparation
*State how the dummy data is generated for the tests.*
*   **Methodology:** Uses a static `TestDataFactory` utility class (e.g., `createReservation()`, `createTableList()`) to ensure consistent dummy SQL data models across all tests.
*   **Setup:** The `@BeforeEach` lifecycle method is used to initialize shared Data Transfer Objects (DTOs) and entity stubs before each HTTP request.

---

## 4. Test Case Matrix

### GET Requests (Retrieval)
| Endpoint | Test Method Name | Scenario | Mock Setup (`given`) | Expected HTTP Status | Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/resource` | `getAll_returnsListAnd200` | Successfully retrieves all records. | Returns `List.of(mockEntity)`. | `200 OK` | Validates JSON array size is > 0 and verifies service method was called. |
| `GET /api/resource` | `getAll_whenEmpty_returnsNotFound` | Database table is empty. | Returns `Collections.emptyList()`. | `404 NOT_FOUND` | Verifies custom `ErrorResponse` payload is returned. |
| `GET /api/resource/{id}` | `getById_whenFound_returns200` | Entity exists for requested ID. | Returns `Optional.of(mockEntity)`. | `200 OK` | Validates JSON payload matches the requested ID. |
| `GET /api/resource/{id}` | `getById_whenMissing_returns404` | ID does not exist in the database. | Returns `Optional.empty()`. | `404 NOT_FOUND` | Verifies `ErrorResponse` message correctly states the resource is missing. |

### POST / PUT Requests (Creation & Modification)
| Endpoint | Test Method Name | Scenario | Mock Setup (`given`) | Expected HTTP Status | Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/resource` | `create_whenValid_returns201` | All business rules pass and entity is created. | Returns saved entity stub. | `201 CREATED` | Validates returned JSON matches input DTO; verifies `service.save()` executed once. |
| `POST /api/resource` | `create_whenMissingParent_returns404` | The parent entity (e.g., associated `Reservation` or `Customer`) cannot be found. | Parent repository mock returns `Optional.empty()`. | `404 NOT_FOUND` | Verifies `never().save(any())` is called to prevent orphan records. |
| `POST /api/resource` | `create_whenCapacityTooSmall_returns400` | Data is valid, but fails business rule (e.g., party size exceeds table capacity). | `service.hasCapacityFor()` returns `false`. | `400 BAD_REQUEST` | Returns constraint violation error; verifies `never().save(any())`. |
| `POST /api/resource` | `create_whenOverlapping_returns409` | Time slot is already booked for the requested table. | `service.isAvailable()` returns `false`. | `409 CONFLICT` | Verifies scheduling conflict error; verifies `never().save(any())`. |
| `POST /api/resource` | `create_whenInvalidDto_returns400` | DTO fails `@Valid` constraints (e.g., missing email, negative party size). | Service is never called. | `400 BAD_REQUEST` | Validates Spring's `MethodArgumentNotValidException` is triggered. |

### DELETE Requests (Removal)
| Endpoint | Test Method Name | Scenario | Mock Setup (`given`) | Expected HTTP Status | Assertions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `DELETE /api/resource/{id}` | `delete_whenFound_returns200` | Entity is found and deleted. | `existsById()` returns `true`. | `200 OK` | Verifies `service.delete()` was executed exactly once. |
| `DELETE /api/resource/{id}` | `delete_whenNotFound_returns404` | ID to delete does not exist. | `existsById()` returns `false`. | `404 NOT_FOUND` | Verifies `never().delete()` is executed. |

---

## 5. Key Edge Cases & Business Logic Validated
*Detail specific business constraints unique to this controller.*
*   **Time Slot Availability Guardrails:** Ensures the controller halts execution and throws a `409 CONFLICT` if the `TableService` detects an overlapping reservation for the requested time slot (`isAvailable()` check).
*   **Capacity Guardrails:** Ensures the controller halts execution and throws a `400 BAD_REQUEST` if the `TableService` determines the requested party size exceeds the table's maximum capacity (`hasCapacityFor()` check).
*   **Orphan Prevention:** Guarantees that the controller prevents database mutation (via `verify(repository, never()).save()`) if a linked parent entity (like a `Customer` or `Reservation`) is missing.