package com.pants.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pants.backend.entity.RStatus;
import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.Table;
import com.pants.backend.entity.TableList;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.RStatusRepository;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.repository.TableRepository;
import com.pants.backend.utils.TestDataFactory;

@ExtendWith(MockitoExtension.class)
class TableServiceTest {

    @Mock
    private TableRepository tableRepository;

    @Mock
    private TableListRepository tableListRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private RStatusRepository rStatusRepository;

    @InjectMocks
    private TableService tableService;

    private static Table table(int id, int capacity) {
        return TestDataFactory.createTable(id, capacity);
    }

    private void stubCancelledStatus() {
        RStatus cancelledStatus = new RStatus("CANCELLED");
        cancelledStatus.setId(3);
        when(rStatusRepository.findById(3)).thenReturn(Optional.of(cancelledStatus));
    }

    private static TableList assignment(int reservationId, int tableId) {
        return TestDataFactory.createTableList(reservationId, tableId);
    }

    private static Reservation reservation(int reservationId, LocalDateTime date, LocalTime start, LocalTime end) {
        return TestDataFactory.createReservation(reservationId, date, start, end);
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
    void findAvailableTables_whenSuitableTablesAreFree_returnsSmallestFirst() {
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        Table twoPersonTable = table(1, 2);
        Table fourPersonTable = table(2, 4);
        Table sixPersonTable = table(3, 6);
        when(tableRepository.findByCapacityGreaterThanEqualOrderByCapacityAsc(2))
                .thenReturn(List.of(twoPersonTable, fourPersonTable, sixPersonTable));

        List<Table> available = tableService.findAvailableTables(
                2, date, LocalTime.of(19, 0), LocalTime.of(21, 0));

        assertThat(available).containsExactly(twoPersonTable, fourPersonTable, sixPersonTable);
    }

    @Test
    void findAvailableTables_whenSmallestTableIsBooked_returnsLargerAvailableTables() {
        stubCancelledStatus();
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        Table twoPersonTable = table(1, 2);
        Table fourPersonTable = table(2, 4);
        Table sixPersonTable = table(3, 6);
        when(tableRepository.findByCapacityGreaterThanEqualOrderByCapacityAsc(2))
                .thenReturn(List.of(twoPersonTable, fourPersonTable, sixPersonTable));
        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment(10, 1)));
        when(reservationRepository.findAllById(List.of(10))).thenReturn(List.of(
                reservation(10, date, LocalTime.of(18, 30), LocalTime.of(20, 30))));

        List<Table> available = tableService.findAvailableTables(
                2, date, LocalTime.of(19, 0), LocalTime.of(21, 0));

        assertThat(available).containsExactly(fourPersonTable, sixPersonTable);
    }

    @Test
    void findAvailableTables_whenNoTablesHaveEnoughCapacity_returnsEmpty() {
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        when(tableRepository.findByCapacityGreaterThanEqualOrderByCapacityAsc(7)).thenReturn(List.of());

        assertThat(tableService.findAvailableTables(
                7, date, LocalTime.of(19, 0), LocalTime.of(21, 0))).isEmpty();
        verifyNoInteractions(tableListRepository, reservationRepository);
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
        verifyNoInteractions(reservationRepository);
    }

    @Test
    void isAvailable_whenExistingReservationOverlapsSameDay_returnsFalse() {
        stubCancelledStatus();
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        LocalTime start = LocalTime.of(19, 0);
        LocalTime end = LocalTime.of(21, 0);

        TableList assignment = assignment(10, 1);

        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment));
        when(reservationRepository.findAllById(List.of(10))).thenReturn(List.of(
                reservation(10, date, LocalTime.of(18, 30), LocalTime.of(20, 30))));

        boolean available = tableService.isAvailable(1, date, start, end);

        assertThat(available).isFalse();
    }

    @Test
    void isAvailable_whenExistingReservationIsOnAnotherDay_returnsTrue() {
        stubCancelledStatus();
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        LocalTime start = LocalTime.of(19, 0);
        LocalTime end = LocalTime.of(21, 0);

        TableList assignment = assignment(10, 1);

        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment));
        when(reservationRepository.findAllById(List.of(10))).thenReturn(List.of(
                reservation(10, LocalDateTime.of(2026, 12, 2, 19, 0), LocalTime.of(19, 0), LocalTime.of(21, 0))));

        boolean available = tableService.isAvailable(1, date, start, end);

        assertThat(available).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"CANCELLED", "cancelled", "CaNcElLeD", "RENAMED"})
    void isAvailable_whenOverlappingReservationIsCancelled_returnsTrue(String statusName) {
        stubCancelledStatus();
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        Reservation cancelled = reservation(10, date, LocalTime.of(18, 30), LocalTime.of(20, 30));
        RStatus status = new RStatus(statusName);
        status.setId(3);
        cancelled.setStatus(status);

        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment(10, 1)));
        when(reservationRepository.findAllById(List.of(10))).thenReturn(List.of(cancelled));

        assertThat(tableService.isAvailable(1, date, LocalTime.of(19, 0), LocalTime.of(21, 0)))
                .isTrue();
    }

    @Test
    void isAvailable_whenMultipleReservationsExist_loadsThemTogetherAndDetectsOverlap() {
        stubCancelledStatus();
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        Reservation earlier = reservation(10, date, LocalTime.of(17, 0), LocalTime.of(19, 0));
        Reservation overlapping = reservation(20, date, LocalTime.of(20, 0), LocalTime.of(22, 0));

        when(tableListRepository.findByIdTableId(1))
                .thenReturn(List.of(assignment(10, 1), assignment(20, 1)));
        when(reservationRepository.findAllById(List.of(10, 20)))
                .thenReturn(List.of(earlier, overlapping));

        assertThat(tableService.isAvailable(1, date, LocalTime.of(19, 0), LocalTime.of(21, 0)))
                .isFalse();
        verify(reservationRepository).findAllById(List.of(10, 20));
        verify(reservationRepository, never()).findById(anyInt());
    }

    @Test
    void isAvailable_whenAssignedReservationNoLongerExists_returnsTrue() {
        stubCancelledStatus();
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment(10, 1)));
        when(reservationRepository.findAllById(List.of(10))).thenReturn(List.of());

        assertThat(tableService.isAvailable(1, date, LocalTime.of(19, 0), LocalTime.of(21, 0)))
                .isTrue();
    }

    @ParameterizedTest
    @CsvSource({
        "17:00, 19:00, true",
        "21:00, 22:00, true",
        "18:00, 20:00, false",
        "20:00, 22:00, false",
        "18:00, 22:00, false",
        "19:30, 20:30, false",
        "19:00, 21:00, false"
    })
    void isAvailable_respectsOverlapBoundaries(String existingStart, String existingEnd, boolean expected) {
        stubCancelledStatus();
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        Reservation existing = reservation(10, date, LocalTime.parse(existingStart), LocalTime.parse(existingEnd));

        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment(10, 1)));
        when(reservationRepository.findAllById(List.of(10))).thenReturn(List.of(existing));

        assertThat(tableService.isAvailable(1, date, LocalTime.of(19, 0), LocalTime.of(21, 0)))
                .isEqualTo(expected);
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(ints = {1, 2, 4})
    void isAvailable_whenStatusNameIsCancelledButIdDiffers_returnsFalse(Integer statusId) {
        stubCancelledStatus();
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        Reservation existing = reservation(10, date, LocalTime.of(19, 0), LocalTime.of(21, 0));
        RStatus status = new RStatus("CANCELLED");
        status.setId(statusId);
        existing.setStatus(status);
        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment(10, 1)));
        when(reservationRepository.findAllById(List.of(10))).thenReturn(List.of(existing));

        assertThat(tableService.isAvailable(1, date, LocalTime.of(19, 0), LocalTime.of(21, 0)))
                .isFalse();
    }

    @Test
    void isAvailable_whenStatusThreeIsMissing_throwsConfigurationError() {
        LocalDateTime date = LocalDateTime.of(2026, 12, 1, 19, 0);
        when(tableListRepository.findByIdTableId(1)).thenReturn(List.of(assignment(10, 1)));
        when(rStatusRepository.findById(3)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tableService.isAvailable(
                1, date, LocalTime.of(19, 0), LocalTime.of(21, 0)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Reservation status with ID 3 missing");
    }

}
