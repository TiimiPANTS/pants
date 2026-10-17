package com.pants.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.pants.backend.dto.ReservationDTO;
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
}
