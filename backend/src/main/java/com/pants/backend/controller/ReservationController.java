package com.pants.backend.controller;

import java.util.List;
import java.util.Map;

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
import com.pants.backend.entity.Customer;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.CustomerRepository;
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
    private final CustomerRepository customerRepository;

    public ReservationController(
            ReservationRepository reservationRepository,
            CustomerRepository customerRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.customerRepository = customerRepository;
    }

    // GET /api/reservations - Get all reservations

    @Operation(summary = "Get all reservations", description = "Returns a list of all reservations")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All reservations found successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Reservation.class))
            ),
            @ApiResponse(responseCode = "404", description = "No reservations found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })

    @GetMapping
    public ResponseEntity<?> getAllReservations() {
        List<Reservation> reservations = reservationRepository.findAll();

        if (reservations.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "No reservations found"));
        }

        return ResponseEntity.ok(reservations);
    }

    // GET /api/reservations/{id} - Get reservation by ID

    @Operation(summary = "Get reservation by ID", description = "Returns a single reservation by its ID"
    )
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
        return reservationRepository.findById(id)
                .map(reservation -> ResponseEntity.ok((Object) reservation))
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse(404, "Reservation not found"))
                );
    }

    // POST /api/reservations - Create a new reservation

    @Operation(summary = "Create a new reservation", description = "Adds a new reservation to the system"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Reservation created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = Reservation.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid reservation data",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })

    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody Reservation reservation) {
        try {
            ResponseEntity<?> customerValidation = validateAndAttachCustomer(reservation);

            if (customerValidation != null) {
                return customerValidation;
            }

            reservation.setReservationId(null);

            Reservation savedReservation = reservationRepository.save(reservation);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedReservation);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(
                            400,
                            "Invalid reservation data: " + e.getMessage()
                    ));
        }
    }

    // PUT /api/reservations/{id} - Update an existing reservation

    @Operation(summary = "Update an existing reservation", description = "Updates information for an existing reservation"
    )
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
            @RequestBody Reservation reservation
    ) {
        Reservation existingReservation = reservationRepository.findById(id).orElse(null);

        if (existingReservation == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "Reservation not found"));
        }

        ResponseEntity<?> customerValidation = validateAndAttachCustomer(reservation);

        if (customerValidation != null) {
            return customerValidation;
        }

        existingReservation.setCustomer(reservation.getCustomer());
        existingReservation.setStartTime(reservation.getStartTime());
        existingReservation.setEndTime(reservation.getEndTime());
        existingReservation.setDatetime(reservation.getDatetime());
        existingReservation.setPartySize(reservation.getPartySize());
        existingReservation.setDetails(reservation.getDetails());

        Reservation updatedReservation = reservationRepository.save(existingReservation);

        return ResponseEntity.ok(updatedReservation);
    }

    // DELETE /api/reservations/{id} - Delete reservation by ID

    @Operation(summary = "Delete reservation by ID", description = "Deletes a single reservation by its ID"
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Reservation deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(type = "object", example = "{\"message\": \"Successfully deleted reservation with id 1\"}"))
            ),
            @ApiResponse(responseCode = "404", description = "Reservation not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )

    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReservationById(@PathVariable Long id) {
        if (reservationRepository.existsById(id)) {
            reservationRepository.deleteById(id);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Successfully deleted reservation with id " + id
                    )
            );
        }

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "Reservation not found"));
    }

    // Customer ID validation

    private ResponseEntity<?> validateAndAttachCustomer(Reservation reservation) {
        if (reservation.getCustomer() == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "Customer is required"));
        }

        Long customerId = reservation.getCustomer().getId();

        if (customerId == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "Customer id is required"));
        }

        Customer existingCustomer = customerRepository.findById(customerId).orElse(null);

        if (existingCustomer == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(
                            404,
                            "Customer with id " + customerId + " does not exist"
                    ));
        }

        reservation.setCustomer(existingCustomer);

        return null;
    }
}