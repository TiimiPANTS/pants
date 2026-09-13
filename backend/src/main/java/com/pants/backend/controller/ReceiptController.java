package com.pants.backend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.dto.ReceiptDTO;
import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.entity.Receipt;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.ReceiptRepository;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.service.ReceiptService;

// SWAGGER
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;


@RestController
@RequestMapping("/api/receipts")
@Tag(name = "Receipt API", description = "Endpoints for managing receipts")

public class ReceiptController {

    private final ReceiptRepository receiptRepository;
    private final ReservationRepository reservationRepository;
    private final ReceiptService receiptService;

    public ReceiptController(
            ReceiptRepository receiptRepository,
            ReservationRepository reservationRepository, ReceiptService receiptService) {
        this.receiptRepository = receiptRepository;
        this.reservationRepository = reservationRepository;
        this.receiptService = receiptService;
    }

    //SWAGGER
     @Operation(
            summary = "Get all receipts",
            description = "Returns a list of all receipts"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "All receipts found successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ReceiptDTO.class)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "No receipts found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })

    @GetMapping
    public ResponseEntity<?> getAllReceipts(){
        List<Receipt> receipts = receiptRepository.findAll();

        if(receipts.isEmpty()) {
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "No receipts found"));
        }

        List<ReceiptDTO> receiptDTOs = receipts.stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(receiptDTOs);

    }

    @Operation(
        summary = "Get receipt by ID",
        description = "Returns a receipt by its ID"
)
@ApiResponses(value = {
        @ApiResponse(
                responseCode = "200",
                description = "Receipt found successfully",
                content = @Content(
                        mediaType = "application/json",
                        schema = @Schema(implementation = ReceiptDTO.class)
                )
        ),
        @ApiResponse(
                responseCode = "404",
                description = "Receipt not found",
                content = @Content(
                        mediaType = "application/json",
                        schema = @Schema(implementation = ErrorResponse.class)
                )
        )
})

@GetMapping("/{receiptId}")
public ResponseEntity<?> getReceiptById(
        @PathVariable Integer receiptId) {

    Receipt receipt = receiptRepository
            .findById(receiptId)
            .orElse(null);

    if (receipt == null) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "Receipt not found"));
    }

    return ResponseEntity.ok(toDto(receipt));
}
    //SWAGGER
    @Operation(
            summary= "Delete receipt by ID",
            description = "Deletes a receipt by its ID"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "204",
                    description = "Receipt deleted succesfully"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Receipt not found",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })

    @DeleteMapping("/{receiptId}")
    public ResponseEntity<?> deleteReceipt(
            @PathVariable Integer receiptId) {

            if (!receiptRepository.existsById(receiptId)) {
                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse(404, "Receipt not found"));
            }
            
            receiptRepository.deleteById(receiptId);

            return ResponseEntity.noContent().build();

            }
    
    // SWAGGER
    @Operation(
            summary = "Create receipt",
            description = "Creates a receipt for an existing reservation"
    )
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "201",
                    description = "Receipt created successfully",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ReceiptDTO.class)
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
                    responseCode = "500",
                    description = "Receipt created but email sending failed",
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = ErrorResponse.class)
                    )
            )
    })
    

    @PostMapping("/{reservationId}")
    public ResponseEntity<?> createReceipt(
            @PathVariable Integer reservationId) {

        Reservation reservation = reservationRepository
                .findById(reservationId)
                .orElse(null);

        if (reservation == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "Reservation not found"));
        }

        Receipt receipt = new Receipt();
        receipt.setReservation(reservation);
        receipt.setIssued(LocalDateTime.now());

        Receipt savedReceipt = receiptRepository.save(receipt);

        try {
            receiptService.sendReceipt(reservationId);
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(500, "Receipt created, but failed to send email"));
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toDto(savedReceipt));
    }
        // uusi apumetodi, joka muuntaa Receipt-entiteetin DTO:ksi.
    private ReceiptDTO toDto(Receipt receipt) {

        ReceiptDTO receiptDTO = new ReceiptDTO();

        receiptDTO.setReceiptId(receipt.getReceiptId());
        receiptDTO.setIssued(receipt.getIssued());

        Reservation reservation = receipt.getReservation();

        // Tehdään ReservationDTO kuitin sisälle
        ReservationDTO reservationDTO = new ReservationDTO();

        reservationDTO.setStartTime(reservation.getStartTime());
        reservationDTO.setEndTime(reservation.getEndTime());
        reservationDTO.setPartySize(reservation.getPartySize());
        reservationDTO.setDetails(reservation.getDetails());

        // Tehdään CustomerDTO varauksen sisälle
        CustomerDTO customerDTO = new CustomerDTO(
                reservation.getCustomer().getId(),
                reservation.getCustomer().getFirstname(),
                reservation.getCustomer().getLastname(),
                reservation.getCustomer().getEmail()
        );

        reservationDTO.setCustomer(customerDTO);

        // Lisätään ReservationDTO ReceiptDTO:n sisälle
        receiptDTO.setReservation(reservationDTO);

        return receiptDTO;
    }
}