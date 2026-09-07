package com.pants.backend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.entity.Receipt;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.ReceiptRepository;
import com.pants.backend.repository.ReservationRepository;

@RestController
@RequestMapping("/api/receipts")
public class ReceiptController {

    private final ReceiptRepository receiptRepository;
    private final ReservationRepository reservationRepository;

    public ReceiptController(
            ReceiptRepository receiptRepository,
            ReservationRepository reservationRepository) {
        this.receiptRepository = receiptRepository;
        this.reservationRepository = reservationRepository;
    }

    @GetMapping
    public List<Receipt> getAllReceipts() {
        return receiptRepository.findAll();
    }

    @PostMapping("/{reservationId}")
    public Receipt createReceipt(@PathVariable Integer reservationId) {

        Reservation reservation = reservationRepository.findById(reservationId).orElse(null);

        if (reservation == null) {
            return null;
        }

        Receipt receipt = new Receipt();
        receipt.setReservation(reservation);
        receipt.setIssued(LocalDateTime.now());

        return receiptRepository.save(receipt);
    }
}