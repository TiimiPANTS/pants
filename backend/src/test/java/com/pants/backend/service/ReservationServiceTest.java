package com.pants.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.dto.ReservationAvailabilityDTO;
import com.pants.backend.entity.Customer;
import com.pants.backend.entity.RStatus;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.CustomerRepository;
import com.pants.backend.repository.RStatusRepository;
import com.pants.backend.repository.ReservationRepository;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private RStatusRepository rStatusRepository;

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

    // cancelReservationByToken

    @Test
    void cancelByToken_whenConfirmed_setsStatusCancelled() {
        Reservation reservation = reservation("CONFIRMED", LocalDateTime.now().plusDays(2));
        RStatus cancelled = new RStatus("CANCELLED");
        when(rStatusRepository.findByNameForUpdate("CONFIRMED"))
                .thenReturn(Optional.of(new RStatus("CONFIRMED")));

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
    void create_whenSlotCapacityWouldBeExceeded_throwsIllegalState() {
        ReservationDTO dto = reservationDto(5);
        Reservation existing = reservation("CONFIRMED", dto.getDatetime());
        existing.setStartTime(dto.getStartTime());
        existing.setPartySize(6);
        when(rStatusRepository.findByNameForUpdate("CONFIRMED"))
                .thenReturn(Optional.of(new RStatus("CONFIRMED")));
        when(reservationRepository.findByDatetimeGreaterThanEqualAndDatetimeLessThan(
                dto.getDatetime().toLocalDate().atStartOfDay(),
                dto.getDatetime().toLocalDate().plusDays(1).atStartOfDay()
        )).thenReturn(List.of(existing));

        assertThatThrownBy(() -> reservationService.createReservation(dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not enough capacity");
        verify(customerRepository, never()).save(any());
    }

    @Test
    void create_whenSlotHasCapacity_savesReservation() {
        ReservationDTO dto = reservationDto(4);
        Customer customer = new Customer();
        when(rStatusRepository.findByNameForUpdate("CONFIRMED"))
                .thenReturn(Optional.of(new RStatus("CONFIRMED")));
        when(customerRepository.findByEmailIgnoreCase("test@example.com"))
                .thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Reservation result = reservationService.createReservation(dto);

        assertThat(result.getPartySize()).isEqualTo(4);
        assertThat(result.getStatus().getName()).isEqualTo("CONFIRMED");
    }

    @Test
    void updateByToken_updatesReservationWithinSlotCapacity() {
        ReservationDTO dto = reservationDto(5);
        Reservation existing = reservation("CONFIRMED", dto.getDatetime());
        existing.setStartTime(dto.getStartTime());
        existing.setPartySize(10);
        when(reservationRepository.findByEditToken("test-token"))
                .thenReturn(Optional.of(existing));
        when(reservationRepository.findByDatetimeGreaterThanEqualAndDatetimeLessThan(
                dto.getDatetime().toLocalDate().atStartOfDay(),
                dto.getDatetime().toLocalDate().plusDays(1).atStartOfDay()
        )).thenReturn(List.of(existing));
        when(rStatusRepository.findByNameForUpdate("CONFIRMED"))
                .thenReturn(Optional.of(new RStatus("CONFIRMED")));
        Customer customer = new Customer();
        existing.setCustomer(customer);
        when(customerRepository.save(customer)).thenReturn(customer);
        when(reservationRepository.save(existing)).thenReturn(existing);

        Reservation updated = reservationService.updateReservationByToken("test-token", dto);

        assertThat(updated.getPartySize()).isEqualTo(5);
    }

    @Test
    void getAvailability_includesSlotsWithoutReservationsWithTenGuestsAvailable() {
        LocalDate date = LocalDate.of(2026, 12, 7);

        List<ReservationAvailabilityDTO> availability =
                reservationService.getReservationAvailability(date, date);

        assertThat(availability).hasSize(15);
        assertThat(availability.get(0).getDate()).isEqualTo(date);
        assertThat(availability.get(0).getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(availability).allSatisfy(slot ->
                assertThat(slot.getAvailableCapacity()).isEqualTo(10)
        );
    }

    @Test
    void getAvailability_subtractsGuestsFromActiveReservationsInMatchingSlot() {
        LocalDate date = LocalDate.of(2026, 12, 7);
        Reservation active = reservation("CONFIRMED", date.atTime(10, 0));
        active.setStartTime(LocalTime.of(10, 0));
        active.setPartySize(4);
        Reservation cancelled = reservation("CANCELLED", date.atTime(10, 0).plusMinutes(1));
        cancelled.setStartTime(LocalTime.of(10, 0));
        cancelled.setPartySize(3);
        when(reservationRepository.findByDatetimeGreaterThanEqualAndDatetimeLessThan(
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay()
        )).thenReturn(List.of(active, cancelled));

        List<ReservationAvailabilityDTO> availability =
                reservationService.getReservationAvailability(date, date);

        assertThat(availability.get(0).getAvailableCapacity()).isEqualTo(6);
        assertThat(availability.get(1).getAvailableCapacity()).isEqualTo(10);
    }

    private static ReservationDTO reservationDto(int partySize) {
        ReservationDTO dto = new ReservationDTO();
        dto.setCustomer(new com.pants.backend.dto.CustomerDTO(
                null,
                "Test",
                "Customer",
                "test@example.com"
        ));
        dto.setDatetime(LocalDateTime.of(2027, 1, 15, 19, 0));
        dto.setStartTime(LocalTime.of(19, 0));
        dto.setEndTime(LocalTime.of(21, 0));
        dto.setPartySize(partySize);
        return dto;
    }
}
