package com.pants.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.dto.ReservationResponse;
import com.pants.backend.entity.Reservation;
import com.pants.backend.service.ReservationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/reservations")
@Tag(
    name = "Reservation API",
    description = "Endpoints for managing reservations"
)
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(
        ReservationService reservationService
    ) {
        this.reservationService = reservationService;
    }

    // GET /api/reservations
    @Operation(
        summary = "Get all reservations",
        description = "Returns a list of all reservations (empty list if none)"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Reservations returned successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Reservation.class)
            )
        )
    })
    @GetMapping
    public ResponseEntity<List<Reservation>> getAllReservations() {
        return ResponseEntity.ok(
            reservationService.getAllReservations()
        );
    }

    // GET /api/reservations/{id}
    @Operation(
        summary = "Get reservation by ID",
        description = "Returns a single reservation by its ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Reservation found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Reservation.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Reservation not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> getReservationById(
        @PathVariable Integer id
    ) {
        Reservation reservation =
            reservationService.getReservationById(id);

        if (reservation == null) {
            return notFound("Reservation not found");
        }

        return ResponseEntity.ok(reservation);
    }

    // GET /api/reservations/manage/{token}
    @Operation(
        summary = "Get reservation by edit token",
        description = "Returns a reservation using the edit token from the confirmation link"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Reservation found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ReservationResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Reservation not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @GetMapping("/manage/{token}")
    public ResponseEntity<?> getReservationByToken(
        @PathVariable String token
    ) {
        try {
            Reservation reservation =
                reservationService.getReservationByToken(token);

            return ResponseEntity.ok(
                new ReservationResponse(reservation)
            );
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        }
    }

    // POST /api/reservations
    @Operation(
        summary = "Create a new reservation",
        description = "Adds a new reservation to the system and returns it with an edit token"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "201",
            description = "Reservation created successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ReservationResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid reservation data",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @PostMapping
    public ResponseEntity<?> createReservation(
        @RequestBody ReservationDTO reservationDTO
    ) {
        try {
            Reservation savedReservation =
                reservationService.createReservation(
                    reservationDTO
                );

            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ReservationResponse(savedReservation));
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        }
    }

    // PUT /api/reservations/{id}
    @Operation(
        summary = "Update an existing reservation",
        description = "Updates information for an existing reservation"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Reservation updated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Reservation.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid reservation data",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Reservation not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservation(
        @PathVariable Integer id,
        @RequestBody ReservationDTO reservationDTO
    ) {
        try {
            Reservation updatedReservation =
                reservationService.updateReservation(
                    id,
                    reservationDTO
                );

            return ResponseEntity.ok(updatedReservation);
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        }
    }

    // PUT /api/reservations/manage/{token}
    @Operation(
        summary = "Update reservation by edit token",
        description = "Lets the customer update their reservation using the edit token"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Reservation updated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ReservationResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid reservation data",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Reservation not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Reservation can no longer be modified",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @PutMapping("/manage/{token}")
    public ResponseEntity<?> updateReservationByToken(
        @PathVariable String token,
        @RequestBody ReservationDTO reservationDTO
    ) {
        try {
            Reservation updatedReservation =
                reservationService.updateReservationByToken(
                    token,
                    reservationDTO
                );

            return ResponseEntity.ok(
                new ReservationResponse(updatedReservation)
            );
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(409, e.getMessage()));
        }
    }

     // PATCH /api/reservations/manage/{token}/cancel
    @Operation(
        summary = "Cancel reservation by edit token",
        description = "Lets the customer cancel their reservation using the edit token"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Reservation cancelled successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ReservationResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Reservation not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Reservation already cancelled or can no longer be cancelled",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @PatchMapping("/manage/{token}/cancel")
    public ResponseEntity<?> cancelReservationByToken(
        @PathVariable String token
    ) {
        try {
            Reservation cancelledReservation =
                reservationService.cancelReservationByToken(token);

            return ResponseEntity.ok(
                new ReservationResponse(cancelledReservation)
            );
        } catch (NoSuchElementException e) {
            return notFound(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(409, e.getMessage()));
        }
    }

    // DELETE /api/reservations/{id}
    @Operation(
        summary = "Delete reservation by ID",
        description = "Deletes a single reservation by its ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Reservation deleted successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(
                    type = "object",
                    example = "{\"message\": \"Successfully deleted reservation with id 1\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "404",
            description = "Reservation not found",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReservationById(
        @PathVariable Integer id
    ) {
        if (!reservationService.deleteReservation(id)) {
            return notFound("Reservation not found");
        }

        return ResponseEntity.ok(
            Map.of(
                "message",
                "Successfully deleted reservation with id " + id
            )
        );
    }

    private ResponseEntity<ErrorResponse> notFound(String message) {
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(404, message));
    }

    private ResponseEntity<ErrorResponse> badRequest(String message) {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(400, message));
    }
}
