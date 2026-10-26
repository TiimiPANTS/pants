package com.pants.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ReservationAvailabilityDTO;
import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.entity.Customer;
import com.pants.backend.entity.RStatus;
import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.Table;
import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;
import com.pants.backend.repository.CustomerRepository;
import com.pants.backend.repository.RStatusRepository;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.utils.TestDataFactory;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private RStatusRepository rStatusRepository;

    @Mock
    private TableService tableService;

    @Mock
    private TableListRepository tableListRepository;

    @InjectMocks
    private ReservationService reservationService;

    private static Reservation reservation(String status, LocalDateTime datetime) {
        Reservation reservation = new Reservation();
        reservation.setReservationId(1);
        reservation.setEditToken("test-token");
        reservation.setDatetime(datetime);
        reservation.setStatus(new RStatus(status));
        return reservation;
    }

    private static ReservationDTO reservationRequest() {
        return TestDataFactory.createReservationRequest("test@example.com",
                LocalDateTime.of(2027, 1, 11, 10, 0), LocalTime.of(10, 0), LocalTime.of(12, 0), 2);
    }

    @Test
    void createReservation_assignsFirstAvailableTableAndUsesSavedReservationId() {
        ReservationDTO dto = reservationRequest();
        RStatus confirmed = new RStatus("CONFIRMED");
        Table small = TestDataFactory.createTable(7, 2);
        Table large = TestDataFactory.createTable(8, 4);
        when(rStatusRepository.findByNameForUpdate("CONFIRMED"))
                .thenReturn(Optional.of(confirmed));
        when(tableService.findAvailableTables(2, dto.getDatetime(), dto.getStartTime(), dto.getEndTime()))
                .thenReturn(List.of(small, large));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> {
            Reservation saved = invocation.getArgument(0);
            saved.setReservationId(42);
            return saved;
        });

        Reservation result = reservationService.createReservation(dto);

        assertThat(result.getReservationId()).isEqualTo(42);
        assertThat(result.getStatus()).isSameAs(confirmed);
        assertThat(result.getCustomer().getEmail()).isEqualTo("test@example.com");
        assertThat(result.getPartySize()).isEqualTo(2);
        assertThat(result.getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(result.getEndTime()).isEqualTo(LocalTime.of(12, 0));
        assertThat(result.getEditToken()).isNotBlank();
        ArgumentCaptor<TableList> assignment = ArgumentCaptor.forClass(TableList.class);
        var order = inOrder(rStatusRepository, tableService, reservationRepository, tableListRepository);
        order.verify(rStatusRepository).findByNameForUpdate("CONFIRMED");
        order.verify(tableService).findAvailableTables(2, dto.getDatetime(), dto.getStartTime(), dto.getEndTime());
        order.verify(reservationRepository).save(any(Reservation.class));
        order.verify(tableListRepository).save(assignment.capture());
        assertThat(assignment.getValue().getId()).isEqualTo(new TableListId(42, 7));
    }

    @Test
    void createReservation_whenNoSuitableTableIsAvailable_doesNotSaveCustomerOrReservation() {
        ReservationDTO dto = reservationRequest();
        when(rStatusRepository.findByNameForUpdate("CONFIRMED"))
                .thenReturn(Optional.of(new RStatus("CONFIRMED")));
        when(tableService.findAvailableTables(2, dto.getDatetime(), dto.getStartTime(), dto.getEndTime()))
                .thenReturn(List.of());

        assertThatThrownBy(() -> reservationService.createReservation(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("No suitable tables available for this reservation");

        verifyNoInteractions(customerRepository, tableListRepository);
        verify(reservationRepository, never()).save(any());
    }

    // cancelReservationByToken

    @Test
    void cancelByToken_whenConfirmed_setsStatusCancelled() {
        Reservation reservation = reservation("CONFIRMED", LocalDateTime.now().plusDays(2));
        RStatus cancelled = new RStatus("CANCELLED");

        when(reservationRepository.findByEditToken("test-token"))
                .thenReturn(Optional.of(reservation));
        when(rStatusRepository.findByName("CANCELLED"))
                .thenReturn(Optional.of(cancelled));
        when(reservationRepository.save(reservation))
                .thenReturn(reservation);

        Reservation result = reservationService.cancelReservationByToken("test-token");

        assertThat(result.getStatus()).isEqualTo(cancelled);
        verify(reservationRepository).save(reservation);
    }

    @Test
    void cancelByToken_whenTokenNotFound_throwsNoSuchElement() {
        when(reservationRepository.findByEditToken("invalid-token"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.cancelReservationByToken("invalid-token"))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessage("Reservation not found");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void cancelByToken_whenAlreadyCancelled_throwsIllegalState() {
        Reservation reservation = reservation("CANCELLED", LocalDateTime.now().plusDays(2));

        when(reservationRepository.findByEditToken("test-token"))
                .thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservationByToken("test-token"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Reservation is already cancelled");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void cancelByToken_whenLessThanOneHourBefore_throwsIllegalState() {
        Reservation reservation = reservation("CONFIRMED", LocalDateTime.now().plusMinutes(30));

        when(reservationRepository.findByEditToken("test-token"))
                .thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservationByToken("test-token"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Reservation can no longer be cancelled");

        verify(reservationRepository, never()).save(any());
    }

        // cancelReservation (owner / admin)

    @Test
    void cancelById_whenConfirmed_setsStatusCancelled() {
        Reservation reservation = reservation("CONFIRMED", LocalDateTime.now().plusDays(2));
        RStatus cancelled = new RStatus("CANCELLED");

        when(reservationRepository.findById(1))
                .thenReturn(Optional.of(reservation));
        when(rStatusRepository.findByName("CANCELLED"))
                .thenReturn(Optional.of(cancelled));
        when(reservationRepository.save(reservation))
                .thenReturn(reservation);

        Reservation result = reservationService.cancelReservation(1);

        assertThat(result.getStatus()).isEqualTo(cancelled);
        verify(reservationRepository).save(reservation);
    }

    @Test
    void cancelById_whenLessThanOneHourBefore_stillCancels() {
        Reservation reservation = reservation("CONFIRMED", LocalDateTime.now().plusMinutes(30));
        RStatus cancelled = new RStatus("CANCELLED");

        when(reservationRepository.findById(1))
                .thenReturn(Optional.of(reservation));
        when(rStatusRepository.findByName("CANCELLED"))
                .thenReturn(Optional.of(cancelled));
        when(reservationRepository.save(reservation))
                .thenReturn(reservation);

        Reservation result = reservationService.cancelReservation(1);

        assertThat(result.getStatus()).isEqualTo(cancelled);
    }

    @Test
    void cancelById_whenNotFound_throwsNoSuchElement() {
        when(reservationRepository.findById(99))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.cancelReservation(99))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessage("Reservation not found");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void cancelById_whenAlreadyCancelled_throwsIllegalState() {
        Reservation reservation = reservation("CANCELLED", LocalDateTime.now().plusDays(2));

        when(reservationRepository.findById(1))
                .thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservation(1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Reservation is already cancelled");

        verify(reservationRepository, never()).save(any());
    }

    // updateReservationByToken

    @Test
    void updateByToken_whenCancelled_throwsIllegalState() {
        Reservation reservation = reservation("CANCELLED", LocalDateTime.now().plusDays(2));

        when(reservationRepository.findByEditToken("test-token"))
                .thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.updateReservationByToken("test-token", new ReservationDTO()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Cancelled reservations cannot be modified");

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void getAvailability_countsOnlyActiveReservationsAtTheSameTime() {
        LocalDate date = LocalDate.of(2026, 10, 19);
        LocalTime startTime = LocalTime.of(10, 0);
        Reservation confirmed = reservation("CONFIRMED", date.atTime(startTime));
        confirmed.setStartTime(startTime);
        confirmed.setPartySize(6);
        Reservation cancelled = reservation("CANCELLED", date.atTime(startTime));
        cancelled.setStartTime(startTime);
        cancelled.setPartySize(4);
        Reservation otherTime = reservation("CONFIRMED", date.atTime(10, 30));
        otherTime.setStartTime(LocalTime.of(10, 30));
        otherTime.setPartySize(4);

        when(reservationRepository.findByDatetimeGreaterThanEqualAndDatetimeLessThan(any(), any()))
                .thenReturn(List.of(confirmed, cancelled, otherTime));

        List<ReservationAvailabilityDTO> availability =
                reservationService.getReservationAvailability(date, date);

        assertThat(availability.get(0).getAvailableCapacity()).isEqualTo(4);
    }

    @Test
    void updateReservation_doesNotCountTheReservationBeingUpdated() {
        LocalDateTime datetime = LocalDate.of(2026, 10, 19).atTime(10, 0);
        LocalTime startTime = LocalTime.of(10, 0);
        Customer customer = new Customer();
        Reservation existing = reservation("CONFIRMED", datetime);
        existing.setStartTime(startTime);
        existing.setPartySize(6);
        existing.setCustomer(customer);
        ReservationDTO dto = new ReservationDTO();
        dto.setCustomer(new CustomerDTO(null, "Test", "User", "test@example.com"));
        dto.setDatetime(datetime);
        dto.setStartTime(startTime);
        dto.setEndTime(LocalTime.of(11, 0));
        dto.setPartySize(6);

        when(reservationRepository.findById(1)).thenReturn(Optional.of(existing));
        when(rStatusRepository.findByNameForUpdate("CONFIRMED"))
                .thenReturn(Optional.of(new RStatus("CONFIRMED")));
        when(reservationRepository.findByDatetimeGreaterThanEqualAndDatetimeLessThan(any(), any()))
                .thenReturn(List.of(existing));
        when(customerRepository.save(customer)).thenReturn(customer);
        when(reservationRepository.save(existing)).thenReturn(existing);
        Table availableTable = TestDataFactory.createTable(7, 6);
        when(tableService.findAvailableTables(6, datetime, startTime, LocalTime.of(11, 0), 1))
                .thenReturn(List.of(availableTable));

        Reservation result = reservationService.updateReservation(1, dto);

        assertThat(result).isSameAs(existing);
        assertThat(result.getPartySize()).isEqualTo(6);
    }
}
