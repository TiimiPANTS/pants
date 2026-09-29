package com.pants.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.Table;
import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.repository.TableRepository;

@ExtendWith(MockitoExtension.class)
class TableServiceTest {

    @Mock
    private TableRepository tableRepository;

    @Mock
    private TableListRepository tableListRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private TableService tableService;

    private static Table table(int id, int capacity) {
        Table table = new Table();
        table.setId(id);
        table.setCapacity(capacity);
        return table;
    }

    private static TableList assignment(int reservationId, int tableId) {
        TableList tableList = new TableList();
        tableList.setId(new TableListId(reservationId, tableId));
        return tableList;
    }

    private static Reservation reservation(int reservationId, LocalDateTime date, LocalTime start, LocalTime end) {
        Reservation reservation = new Reservation();
        reservation.setReservationId(reservationId);
        reservation.setDatetime(date);
        reservation.setStartTime(start);
        reservation.setEndTime(end);
        reservation.setPartySize(4);
        return reservation;
    }

    @Test
    void hasCapacityFor_whenCapacityIsEnough_returnsTrue() {
        Table table = table(1, 6);

        assertThat(tableService.hasCapacityFor(table, 4)).isTrue();
    }

    @Test
    void hasCapacityFor_whenCapacityIsTooLow_returnsFalse() {
        Table table = table(1, 2);

        assertThat(tableService.hasCapacityFor(table, 4)).isFalse();
    }

    @Test
    void isAvailable_whenThereAreNoAssignments_returnsTrue() {
        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of());

        boolean available = tableService.isAvailable(
                1,
                LocalDateTime.of(2026, 12, 1, 19, 0),
                LocalTime.of(19, 0),
                LocalTime.of(21, 0));

        assertThat(available).isTrue();
    }

    @Test
    void isAvailable_whenExistingReservationOverlapsSameDay_returnsFalse() {
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        LocalTime start = LocalTime.of(19, 0);
        LocalTime end = LocalTime.of(21, 0);

        TableList assignment = assignment(10, 1);

        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment));
        when(reservationRepository.findById(10)).thenReturn(Optional.of(
                reservation(10, date, LocalTime.of(18, 30), LocalTime.of(20, 30))));

        boolean available = tableService.isAvailable(1, date, start, end);

        assertThat(available).isFalse();
    }

    @Test
    void isAvailable_whenExistingReservationIsOnAnotherDay_returnsTrue() {
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        LocalTime start = LocalTime.of(19, 0);
        LocalTime end = LocalTime.of(21, 0);

        TableList assignment = assignment(10, 1);

        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment));
        when(reservationRepository.findById(10)).thenReturn(Optional.of(
                reservation(10, LocalDateTime.of(2026, 12, 2, 19, 0), LocalTime.of(19, 0), LocalTime.of(21, 0))));

        boolean available = tableService.isAvailable(1, date, start, end);

        assertThat(available).isTrue();
    }

    @Test
    void findAvailableTables_filtersOutTablesThatDoNotFitOrAreBooked() {
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        LocalTime start = LocalTime.of(19, 0);
        LocalTime end = LocalTime.of(21, 0);

        Table suitable = table(1, 5);
        Table booked = table(3, 6);

        when(tableRepository.findByCapacityGreaterThanEqual(4)).thenReturn(List.of(suitable, booked));
        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of());
        when(tableListRepository.findByIdTableId(3)).thenReturn(List.of(assignment(99, 3)));
        when(reservationRepository.findById(99)).thenReturn(Optional.of(
                reservation(99, date, LocalTime.of(18, 0), LocalTime.of(20, 0))));

        List<Table> available = tableService.findAvailableTables(4, date, start, end);

        assertThat(available).containsExactly(suitable);
    }
}
