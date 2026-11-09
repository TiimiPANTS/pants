package com.pants.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.ReservationRepository;

@Service
public class ReceiptService {

    private static final DateTimeFormatter RESERVATION_DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final ReservationRepository reservationRepository;
    private final EmailService emailService;

    public ReceiptService(
        ReservationRepository reservationRepository,
        EmailService emailService) {
        this.reservationRepository = reservationRepository;
        this.emailService = emailService;
    }

    public void sendReceipt(Integer reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
            .orElseThrow(() -> new IllegalArgumentException(
                "Reservation could not be found: " + reservationId));

        emailService.sendHtmlEmailWithInlineImage(
            reservation.getCustomer().getEmail(),
            "Le Pants - Reservation Confirmation #" + reservation.getReservationId(),
            buildReceiptHtml(reservation),
            "le-pants-logo",
            new ClassPathResource("templates/LePantsLogo.png"),
            "image/png");
    }

    private String buildReceiptHtml(Reservation reservation) {
        String customerName = escape(
            reservation.getCustomer().getFirstname() + " " + reservation.getCustomer().getLastname());

        return loadTemplate()
            .replace("src=\"LePantsLogo.png\"", "src=\"cid:le-pants-logo\"")
            .replace("{{customerName}}", customerName)
            .replace("{{reservationId}}", escape(String.valueOf(reservation.getReservationId())))
            .replace("{{customerEmail}}", escape(reservation.getCustomer().getEmail()))
            .replace(
                "{{reservationDate}}",
                escape(reservation.getDatetime().toLocalDate().format(RESERVATION_DATE_FORMAT)))
            .replace("{{startTime}}", escape(String.valueOf(reservation.getStartTime())))
            .replace("{{endTime}}", escape(String.valueOf(reservation.getEndTime())))
            .replace("{{partySize}}", escape(String.valueOf(reservation.getPartySize())))
            .replace("{{details}}", escape(reservation.getDetails()));
    }

    private String loadTemplate() {
        ClassPathResource template = new ClassPathResource("templates/receipt-email.html");
        try (var input = template.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Could not load receipt email template", e);
        }
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}