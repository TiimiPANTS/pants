package com.pants.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.dto.ReservationResponse;
import com.pants.backend.entity.Reservation;
import com.pants.backend.service.ReservationService;

@ExtendWith(MockitoExtension.class)
class ReservationControllerTest {

    @Mock
    private ReservationService reservationService;

    @InjectMocks
    private ReservationController reservationController;

    // Helper methods

    private static Reservation createReservation() {
        Reservation reservation = new Reservation();

        reservation.setReservationId(1);
        reservation.setDatetime(LocalDateTime.of(2026, 12, 1, 19, 0));
        reservation.setStartTime(LocalTime.of(19, 0));
        reservation.setEndTime(LocalTime.of(21, 0));
        reservation.setPartySize(2);
        reservation.setDetails("Window seat please");
        reservation.setEditToken("test-token");

        return reservation;
    }

    private static ReservationDTO validDto() {
        CustomerDTO customer = new CustomerDTO(
                null,
                "Testi",
                "Kayttaja",
                "testi@mail.fi"
        );

        ReservationDTO dto = new ReservationDTO();

        dto.setCustomer(customer);
        dto.setDatetime(LocalDateTime.of(2026, 12, 1, 19, 0));
        dto.setStartTime(LocalTime.of(19, 0));
        dto.setEndTime(LocalTime.of(21, 0));
        dto.setPartySize(2);
        dto.setDetails("Window seat please");

        return dto;
    }

    private static void assertError(
            ResponseEntity<?> response,
            HttpStatus status,
            String message
    ) {
        assertThat(response.getStatusCode()).isEqualTo(status);
        assertThat(response.getBody()).isInstanceOf(ErrorResponse.class);

        ErrorResponse error = (ErrorResponse) response.getBody();

        assertThat(error.getStatus()).isEqualTo(status.value());
        assertThat(error.getMessage()).isEqualTo(message);
    }

    // GET /api/reservations

    @Test
    void getAll_whenReservationsExist_returnsOk() {
        Reservation first = createReservation();

        Reservation second = createReservation();
        second.setReservationId(2);

        when(reservationService.getAllReservations())
                .thenReturn(List.of(first, second));

        ResponseEntity<List<Reservation>> response =
                reservationController.getAllReservations();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody().get(0).getReservationId()).isEqualTo(1);
        assertThat(response.getBody().get(1).getReservationId()).isEqualTo(2);

        verify(reservationService).getAllReservations();
    }

    @Test
    void getAll_whenNoReservations_returnsOkWithEmptyList() {
        when(reservationService.getAllReservations())
                .thenReturn(List.of());

        ResponseEntity<List<Reservation>> response =
                reservationController.getAllReservations();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();

        verify(reservationService).getAllReservations();
    }

    // GET /api/reservations/{id}

    @Test
    void getById_whenExists_returnsOk() {
        Reservation reservation = createReservation();

        when(reservationService.getReservationById(1))
                .thenReturn(reservation);

        ResponseEntity<?> response = reservationController.getReservationById(1);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(reservation);

        verify(reservationService).getReservationById(1);
    }

    @Test
    void getById_whenNotExists_returnsNotFound() {
        when(reservationService.getReservationById(99))
                .thenReturn(null);

        ResponseEntity<?> response = reservationController.getReservationById(99);

        assertError(response, HttpStatus.NOT_FOUND, "Reservation not found");

        verify(reservationService).getReservationById(99);
    }

    // GET /api/reservations/manage/{token}

    @Test
    void getByToken_whenExists_returnsOk() {
        Reservation reservation = createReservation();

        when(reservationService.getReservationByToken("test-token"))
                .thenReturn(reservation);

        ResponseEntity<?> response =
                reservationController.getReservationByToken("test-token");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(ReservationResponse.class);

        ReservationResponse body = (ReservationResponse) response.getBody();

        assertThat(body.getReservation()).isEqualTo(reservation);
        assertThat(body.getEditToken()).isEqualTo("test-token");

        verify(reservationService).getReservationByToken("test-token");
    }

    @Test
    void getByToken_whenNotExists_returnsNotFound() {
        when(reservationService.getReservationByToken("invalid-token"))
                .thenThrow(new NoSuchElementException("Reservation not found"));

        ResponseEntity<?> response =
                reservationController.getReservationByToken("invalid-token");

        assertError(response, HttpStatus.NOT_FOUND, "Reservation not found");

        verify(reservationService).getReservationByToken("invalid-token");
    }

    // POST /api/reservations

    @Test
    void create_withValidData_returnsCreated() {
        ReservationDTO dto = validDto();
        Reservation savedReservation = createReservation();

        when(reservationService.createReservation(dto))
                .thenReturn(savedReservation);

        ResponseEntity<?> response = reservationController.createReservation(dto);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isInstanceOf(ReservationResponse.class);

        ReservationResponse body = (ReservationResponse) response.getBody();

        assertThat(body.getReservation()).isEqualTo(savedReservation);
        assertThat(body.getEditToken()).isEqualTo("test-token");

        verify(reservationService).createReservation(dto);
    }

    @Test
    void create_withInvalidData_returnsBadRequest() {
        ReservationDTO dto = validDto();

        when(reservationService.createReservation(dto))
                .thenThrow(new IllegalArgumentException("Customer email is required"));

        ResponseEntity<?> response = reservationController.createReservation(dto);

        assertError(response, HttpStatus.BAD_REQUEST, "Customer email is required");

        verify(reservationService).createReservation(dto);
    }

    // PUT /api/reservations/{id}

    @Test
    void update_withValidData_returnsOk() {
        ReservationDTO dto = validDto();
        Reservation updatedReservation = createReservation();

        when(reservationService.updateReservation(1, dto))
                .thenReturn(updatedReservation);

        ResponseEntity<?> response = reservationController.updateReservation(1, dto);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(updatedReservation);

        verify(reservationService).updateReservation(1, dto);
    }

    @Test
    void update_whenNotExists_returnsNotFound() {
        ReservationDTO dto = validDto();

        when(reservationService.updateReservation(99, dto))
                .thenThrow(new NoSuchElementException("Reservation not found"));

        ResponseEntity<?> response = reservationController.updateReservation(99, dto);

        assertError(response, HttpStatus.NOT_FOUND, "Reservation not found");

        verify(reservationService).updateReservation(99, dto);
    }

    @Test
    void update_withInvalidData_returnsBadRequest() {
        ReservationDTO dto = validDto();

        when(reservationService.updateReservation(1, dto))
                .thenThrow(new IllegalArgumentException("Party size must be at least 1"));

        ResponseEntity<?> response = reservationController.updateReservation(1, dto);

        assertError(response, HttpStatus.BAD_REQUEST, "Party size must be at least 1");

        verify(reservationService).updateReservation(1, dto);
    }

    // PUT /api/reservations/manage/{token}

    @Test
    void updateByToken_withValidData_returnsOk() {
        ReservationDTO dto = validDto();
        Reservation updatedReservation = createReservation();

        when(reservationService.updateReservationByToken("test-token", dto))
                .thenReturn(updatedReservation);

        ResponseEntity<?> response =
                reservationController.updateReservationByToken("test-token", dto);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isInstanceOf(ReservationResponse.class);

        ReservationResponse body = (ReservationResponse) response.getBody();

        assertThat(body.getReservation()).isEqualTo(updatedReservation);
        assertThat(body.getEditToken()).isEqualTo("test-token");

        verify(reservationService).updateReservationByToken("test-token", dto);
    }

    @Test
    void updateByToken_whenNotExists_returnsNotFound() {
        ReservationDTO dto = validDto();

        when(reservationService.updateReservationByToken("invalid-token", dto))
                .thenThrow(new NoSuchElementException("Reservation not found"));

        ResponseEntity<?> response =
                reservationController.updateReservationByToken("invalid-token", dto);

        assertError(response, HttpStatus.NOT_FOUND, "Reservation not found");

        verify(reservationService).updateReservationByToken("invalid-token", dto);
    }

    @Test
    void updateByToken_withInvalidData_returnsBadRequest() {
        ReservationDTO dto = validDto();

        when(reservationService.updateReservationByToken("test-token", dto))
                .thenThrow(new IllegalArgumentException("Party size must be at least 1"));

        ResponseEntity<?> response =
                reservationController.updateReservationByToken("test-token", dto);

        assertError(response, HttpStatus.BAD_REQUEST, "Party size must be at least 1");

        verify(reservationService).updateReservationByToken("test-token", dto);
    }

    @Test
    void updateByToken_whenModificationNotAllowed_returnsConflict() {
        ReservationDTO dto = validDto();

        when(reservationService.updateReservationByToken("test-token", dto))
                .thenThrow(new IllegalStateException("Reservation can no longer be modified"));

        ResponseEntity<?> response =
                reservationController.updateReservationByToken("test-token", dto);

        assertError(response, HttpStatus.CONFLICT, "Reservation can no longer be modified");

        verify(reservationService).updateReservationByToken("test-token", dto);
    }

    // DELETE /api/reservations/{id}

    @Test
    void delete_whenExists_returnsOk() {
        when(reservationService.deleteReservation(1))
                .thenReturn(true);

        ResponseEntity<?> response = reservationController.deleteReservationById(1);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .isEqualTo(Map.of("message", "Successfully deleted reservation with id 1"));

        verify(reservationService).deleteReservation(1);
    }

    @Test
    void delete_whenNotExists_returnsNotFound() {
        when(reservationService.deleteReservation(99))
                .thenReturn(false);

        ResponseEntity<?> response = reservationController.deleteReservationById(99);

        assertError(response, HttpStatus.NOT_FOUND, "Reservation not found");

        verify(reservationService).deleteReservation(99);
    }
}