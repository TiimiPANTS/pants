package com.pants.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.ReservationRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/reservations")
@Tag(name = "Reservation API", description = "Endpoints for managing reservations")
public class ReservationController {

    private final ReservationRepository reservationRepository;

    public ReservationController(ReservationRepository reservationRepository) {
        this.reservationRepository = reservationRepository;
    }

    @Operation(summary = "Get all reservations", description = "Returns all reservations from the database")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reservations retrieved successfully",
            content = @Content(mediaType = "application/json",schema = @Schema(implementation = Reservation.class))
        )
    })

    @GetMapping
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    @Operation(summary = "Get reservation by ID", description = "Returns a single reservation by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reservation found",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Reservation.class))
        ),
        @ApiResponse(responseCode = "404", description = "Reservation not found",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
        )
    })

    @GetMapping("/{id}")
    public ResponseEntity<?> getReservationById(@PathVariable Long id) {

        Optional<Reservation> reservation = reservationRepository.findById(id);

        if (reservation.isEmpty()) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "Reservation not found with ID: " + id));
        }

        return ResponseEntity.ok(reservation.get());
    }

    @Operation(summary = "Create a new reservation", description = "Adds a new reservation to the database")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Reservation created successfully",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Reservation.class))
        ),
        @ApiResponse(responseCode = "400",description = "Invalid reservation data",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
        )
    })

    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody Reservation reservation) {

        try {
            Reservation savedReservation = reservationRepository.save(reservation);

            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedReservation);

        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "Invalid reservation data"));
        }
    }

    @Operation(summary = "Update an existing reservation", description = "Updates information for an existing reservation")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reservation updated successfully",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Reservation.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid reservation data",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
        ),
        @ApiResponse(responseCode = "404", description = "Reservation not found",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
        )
    })

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservation(
        @PathVariable Long id,
        @RequestBody Reservation updatedReservation) {

        Optional<Reservation> reservation = reservationRepository.findById(id);

        if (reservation.isEmpty()) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "Reservation not found with ID: " + id));
        }

        try {
            Reservation existingReservation = reservation.get();

            existingReservation.setCustomer(updatedReservation.getCustomer());
            existingReservation.setStarttime(updatedReservation.getStartTime());
            existingReservation.setEndtime(updatedReservation.getEndTime());
            existingReservation.setDatetime(updatedReservation.getDatetime());
            existingReservation.setPartySize(updatedReservation.getPartySize());
            existingReservation.setDetails(updatedReservation.getDetails());
            // existingReservation.setStatus(updatedReservation.getStatus());

            Reservation savedReservation = reservationRepository.save(existingReservation);

            return ResponseEntity.ok(savedReservation);

        } catch (Exception e) {
            return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "Invalid reservation data"));
        }
    }

    @Operation(summary = "Delete reservation by ID", description = "Deletes a single reservation by its ID"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reservation deleted successfully",
            content = @Content( mediaType = "application/json",
                schema = @Schema(type = "object", example = "{\"message\": \"Successfully deleted reservation with id 1\"}"))
        ),
        @ApiResponse(responseCode = "404", description = "Reservation not found",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
        )
    })

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReservation(@PathVariable Long id) {

        if (!reservationRepository.existsById(id)) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "Reservation not found with ID: " + id));
        }

        reservationRepository.deleteById(id);

        return ResponseEntity.ok(
            java.util.Map.of(
                "message",
                "Successfully deleted reservation with id " + id
            )
        );
    }
}