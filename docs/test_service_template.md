# [ServiceName] Test Documentation

**Test Class:** `[ServiceName]Test.java`

**Target Class:** `[ServiceName].java`

**Test Location:** `backend/src/test/java/com/pants/backend/service`

**Tech Stack:** JUnit 5, Mockito, AssertJ (Java 21)

## 1. Scope & Purpose

Describe the business behavior this service owns and what this test suite verifies. State which collaborators are isolated and which behavior is intentionally outside the unit-test scope (for example, repository query correctness, database constraints, or Spring wiring).

## 2. Dependencies & Mocks

List each collaborator, how it is supplied to the service, and which behavior is controlled by the test.

| Dependency | Test setup | Purpose in these tests |
| :--- | :--- | :--- |
| `[RepositoryOrService]` | `@Mock` | `[Describe the returned values or failures being stubbed.]` |
| `[OtherDependency]` | `@Mock` / real instance | `[Describe why it is mocked or kept real.]` |
| `[ServiceUnderTest]` | `@InjectMocks` | Service whose behavior is being verified |

Mention relevant annotations (for example, `@ExtendWith(MockitoExtension.class)`) and avoid describing controller/Web MVC annotations unless this is not a service unit test.

## 3. Test Data Preparation

Describe how entities, DTOs, and time values are created.

* **Factories/helpers:** `[List class-local helpers or shared test factories.]`
* **Setup:** `[Explain per-test stubbing and any lifecycle setup.]`
* **Determinism:** Use fixed values for time, identifiers, and inputs. If production time is involved, state how the test controls or bounds it.

## 4. Test Case Matrix

Organize rows by service method or cohesive behavior. Use one row per scenario or parameterized group.

| Service method | Test method | Scenario | Mock setup | Expected result or exception | Side effects / interactions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `[method(...)]` | `[method_whenCondition_expectedOutcome]` | `[Input and relevant state]` | `[Stubbed dependency behavior]` | `[Returned value, state change, or exception]` | `[Expected save/send call, argument, call count, or no interaction]` |
| `[method(...)]` | `[method_whenFailure_expectedException]` | `[Failure condition]` | `[Stubbed missing data or failure]` | `[Exception type and relevant message]` | `[Verify prohibited mutations do not occur]` |

For parameterized tests, identify the parameter source and summarize the input/output cases rather than duplicating every invocation.

## 5. Business Rules & Edge Cases

List the important invariants this suite verifies, such as:

* Valid and invalid state transitions.
* Missing related data and duplicate records.
* Boundary conditions for dates, times, limits, and capacity.
* Transactional or persistence side effects, including ensuring writes do not happen after validation failures.
* Collaborator failures and how the service propagates or translates them.

Only include rules actually covered by tests. Mark untested but important cases as gaps rather than implying they are verified.

## 6. Coverage Gaps & Follow-up

Record meaningful untested service methods or scenarios and what would be needed to test them. Separate unit-test gaps from integration concerns (for example, repository query behavior or transaction configuration).

## 7. Assessment

Summarize whether the suite gives focused confidence in the service's key business behavior. Note significant limitations, such as untested public methods, reliance on real clock time, verifying implementation details instead of outcomes, or missing integration coverage.
