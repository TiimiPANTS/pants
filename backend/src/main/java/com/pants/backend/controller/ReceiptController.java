package com.pants.backend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.entity.Receipt;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.ReceiptRepository;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.service.ReceiptService;

@RestController
@RequestMapping("/api/receipts")
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

    @GetMapping
    public List<Receipt> getAllReceipts() {
        return receiptRepository.findAll();
    }

    @PostMapping("/{reservationId}")
    public ResponseEntity<?> createReceipt(
            @PathVariable Integer reservationId) {

        Reservation reservation = reservationRepository
                .findById(reservationId)
                .orElse(null);

        if (reservation == null) {
            return ResponseEntity.notFound().build();
        }

        Receipt receipt = new Receipt();
        receipt.setReservation(reservation);
        receipt.setIssued(LocalDateTime.now());

        Receipt savedReceipt = receiptRepository.save(receipt);

        try {
            receiptService.sendReceipt(reservationId);
        } catch (Exception e) {
            e.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    "Receipt created, but failed to send email: " + e.getMessage());
        }

        return ResponseEntity.ok(savedReceipt);
    }
}