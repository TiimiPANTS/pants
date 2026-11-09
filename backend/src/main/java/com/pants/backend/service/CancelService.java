package com.pants.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.pants.backend.entity.Reservation;

@Service
public class CancelService {

    private static final int CANCELLED_STATUS_ID = 3;
    private static final DateTimeFormatter RESERVATION_DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final EmailService emailService;

    public CancelService(EmailService emailService) {
        this.emailService = emailService;
    }

    public void sendCancellationEmail(Reservation reservation) {
        if (reservation.getStatus() == null
            || !Objects.equals(reservation.getStatus().getId(), CANCELLED_STATUS_ID)) {
            return;
        }

        emailService.sendHtmlEmailWithInlineImage(
            reservation.getCustomer().getEmail(),
            "Le Pants - Reservation Cancellation #" + reservation.getReservationId(),
            buildCancellationHtml(reservation),
            "le-pants-logo",
            new ClassPathResource("templates/LePantsLogo.png"),
            "image/png");
    }

    private String buildCancellationHtml(Reservation reservation) {
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
        ClassPathResource template = new ClassPathResource("templates/cancel-email.html");
        try (var input = template.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Could not load cancellation email template", e);
        }
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
