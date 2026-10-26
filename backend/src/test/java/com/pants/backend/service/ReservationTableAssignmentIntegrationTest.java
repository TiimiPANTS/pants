package com.pants.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.annotation.Transactional;

import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.Table;
import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;
import com.pants.backend.repository.CustomerRepository;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.repository.TableRepository;
import com.pants.backend.utils.TestDataFactory;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:tableassignmentdb")
class ReservationTableAssignmentIntegrationTest {

    @BeforeAll
    static void removeExampleTables(@Autowired TableRepository tableRepository) {
        tableRepository.deleteAll();
    }

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private TableRepository tableRepository;

    @MockitoSpyBean
    private TableListRepository tableListRepository;

    private Table table(int capacity) {
        Table table = TestDataFactory.createTable(capacity);
        table.setTableNumber(900 + capacity);
        return tableRepository.save(table);
    }

    private ReservationDTO request(String email, LocalTime start, LocalTime end) {
        return TestDataFactory.createReservationRequest(
                email, LocalDate.of(2027, 1, 11).atTime(start), start, end, 2);
    }

    @Test
    @Transactional
    void assignsSmallestFreeTableAndRejectsOverlapsWhenAllTablesAreBooked() {
        Table large = table(4);
        Table small = table(2);

        Reservation first = reservationService.createReservation(request(
                "first-table@example.com", LocalTime.of(10, 0), LocalTime.of(12, 0)));
        Reservation second = reservationService.createReservation(request(
                "second-table@example.com", LocalTime.of(10, 30), LocalTime.of(12, 30)));

        assertThat(tableListRepository.findById(new TableListId(first.getReservationId(), small.getId())))
                .isPresent();
        assertThat(tableListRepository.findById(new TableListId(second.getReservationId(), large.getId())))
                .isPresent();
        long reservationCount = reservationRepository.count();
        assertThatThrownBy(() -> reservationService.createReservation(request(
                "no-table@example.com", LocalTime.of(11, 0), LocalTime.of(13, 0))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("No suitable tables available for this reservation");
        assertThat(reservationRepository.count()).isEqualTo(reservationCount);
        assertThat(customerRepository.findByEmailIgnoreCase("no-table@example.com")).isEmpty();
    }

    @Test
    @Transactional
    void cancelledReservationAllowsTheTableToBeAssignedAgain() {
        Table table = table(2);
        Reservation first = reservationService.createReservation(request(
                "cancel-table@example.com", LocalTime.of(10, 0), LocalTime.of(12, 0)));
        reservationService.cancelReservation(first.getReservationId());

        Reservation replacement = reservationService.createReservation(request(
                "reuse-table@example.com", LocalTime.of(10, 0), LocalTime.of(12, 0)));

        assertThat(tableListRepository.findById(new TableListId(replacement.getReservationId(), table.getId())))
                .isPresent();
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    @Transactional
    void updatingReservationKeepsItsOwnTableAndMovesToLargerTableWhenNeeded(boolean byToken) {
        Table small = table(2);
        Table large = table(4);
        ReservationDTO dto = request("resize-table@example.com", LocalTime.of(10, 0), LocalTime.of(12, 0));
        Reservation saved = reservationService.createReservation(dto);

        update(saved, dto, byToken);
        assertThat(tableListRepository.findById(new TableListId(saved.getReservationId(), small.getId())))
                .isPresent();

        dto.setPartySize(4);
        update(saved, dto, byToken);

        assertThat(tableListRepository.findById(new TableListId(saved.getReservationId(), small.getId())))
                .isEmpty();
        assertThat(tableListRepository.findById(new TableListId(saved.getReservationId(), large.getId())))
                .isPresent();
        assertThat(reservationRepository.findById(saved.getReservationId()).orElseThrow().getPartySize())
                .isEqualTo(4);
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    @Transactional
    void updatingReservationRejectsAnOccupiedTableWithoutChangingTheOriginal(boolean byToken) {
        Table table = table(2);
        Reservation first = reservationService.createReservation(request(
                "move-table@example.com", LocalTime.of(10, 0), LocalTime.of(11, 0)));
        reservationService.createReservation(request(
                "occupied-table@example.com", LocalTime.of(12, 0), LocalTime.of(13, 0)));
        ReservationDTO changed = request("move-table@example.com", LocalTime.of(12, 0), LocalTime.of(13, 0));

        assertThatThrownBy(() -> update(first, changed, byToken))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("No suitable tables available for this reservation");
        assertThat(first.getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(tableListRepository.findById(new TableListId(first.getReservationId(), table.getId())))
                .isPresent();
    }

    private Reservation update(Reservation saved, ReservationDTO dto, boolean byToken) {
        return byToken
                ? reservationService.updateReservationByToken(saved.getEditToken(), dto)
                : reservationService.updateReservation(saved.getReservationId(), dto);
    }

    @Test
    @Transactional
    void deletingReservationRemovesItsTableLink() {
        Table table = table(2);
        Reservation saved = reservationService.createReservation(request(
                "delete-table@example.com", LocalTime.of(10, 0), LocalTime.of(12, 0)));

        assertThat(reservationService.deleteReservation(saved.getReservationId())).isTrue();
        reservationRepository.flush();

        assertThat(reservationRepository.findById(saved.getReservationId())).isEmpty();
        assertThat(tableListRepository.findById(new TableListId(saved.getReservationId(), table.getId())))
                .isEmpty();
    }

    @Test
    void assignmentSaveFailureRollsBackTheReservationAndCustomer() {
        Table table = table(2);
        long reservationCount = reservationRepository.count();
        long customerCount = customerRepository.count();
        long assignmentCount = tableListRepository.count();
        doThrow(new DataIntegrityViolationException("Simulated assignment failure"))
                .when(tableListRepository).save(any(TableList.class));

        try {
            assertThatThrownBy(() -> reservationService.createReservation(request(
                    "rollback-table@example.com", LocalTime.of(10, 0), LocalTime.of(12, 0))))
                    .isInstanceOf(DataIntegrityViolationException.class)
                    .hasMessage("Simulated assignment failure");
            assertThat(reservationRepository.count()).isEqualTo(reservationCount);
            assertThat(customerRepository.count()).isEqualTo(customerCount);
            assertThat(tableListRepository.count()).isEqualTo(assignmentCount);
            assertThat(customerRepository.findByEmailIgnoreCase("rollback-table@example.com")).isEmpty();
        } finally {
            tableRepository.deleteById(table.getId());
        }
    }
}
