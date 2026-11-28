
package com.pants.backend.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import org.springframework.beans.factory.annotation.Value;

import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.ReservationRepository;

@Service
public class ReceiptService {

    private static final DateTimeFormatter RESERVATION_DATE_FORMAT =
        DateTimeFormatter.ofPattern("dd.MM.yyyy");

    private final ReservationRepository reservationRepository;
    private final EmailService emailService;

    @Value("${app.frontend-url:}")
    private String frontendUrl = "";

    @Value("${app.reservation.max-edits:2}")
    private int maxEdits = 2;

    public ReceiptService(
        ReservationRepository reservationRepository,
        EmailService emailService
    ) {
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
            buildEmailHtml(reservation, "receipt-email.html"),
            "le-pants-logo",
            new ClassPathResource("templates/LePantsLogo.png"),
            "image/png"
        );
    }

    public void sendEditConfirmation(Reservation reservation) {
        emailService.sendHtmlEmailWithInlineImage(
            reservation.getCustomer().getEmail(),
            "Le Pants - Reservation Edited #" + reservation.getReservationId(),
            buildEmailHtml(reservation, "edit-email.html"),
            "le-pants-logo",
            new ClassPathResource("templates/LePantsLogo.png"),
            "image/png"
        );
    }

    private String buildEmailHtml(Reservation reservation, String fileName) {
        String customerName = escape(
            reservation.getCustomer().getFirstname() + " " +
            reservation.getCustomer().getLastname()
        );

        int remainingEdits = Math.max(
            0, maxEdits - reservation.getEditCount()
        );

        boolean hasManagementLink = frontendUrl != null
            && !frontendUrl.isBlank()
            && reservation.getEditToken() != null
            && !reservation.getEditToken().isBlank();

        String editUrl = hasManagementLink
            ? frontendUrl.replaceAll("/+$", "")
                + "/reserve/" + reservation.getEditToken()
            : "";

        String cancelUrl = hasManagementLink
            ? editUrl + "?action=cancel"
            : "";

        String html = loadTemplate(fileName);

        // Remove edit button when no edits remain
        // or the management link is unavailable
        if (remainingEdits == 0 || !hasManagementLink) {
            html = html.replaceAll(
                "(?s)<!-- EDIT_BUTTON_START -->.*?<!-- EDIT_BUTTON_END -->",
                ""
            );
        }

        // Remove edit limit message when edits remain
        if (remainingEdits > 0) {
            html = html.replaceAll(
                "(?s)<!-- EDIT_LIMIT_START -->.*?<!-- EDIT_LIMIT_END -->",
                ""
            );
        }

        // Remove cancellation button if no valid link exists
        if (!hasManagementLink) {
            html = html.replaceAll(
                "(?s)<!-- CANCEL_BUTTON_START -->.*?<!-- CANCEL_BUTTON_END -->",
                ""
            );
        }

        return html
            .replace("src=\"LePantsLogo.png\"", "src=\"cid:le-pants-logo\"")
            .replace("{{editUrl}}", escape(editUrl))
            .replace("{{cancelUrl}}", escape(cancelUrl))
            .replace("{{remainingEdits}}", String.valueOf(remainingEdits))
            .replace("{{customerName}}", customerName)
            .replace("{{reservationId}}", escape(String.valueOf(reservation.getReservationId())))
            .replace("{{customerEmail}}", escape(reservation.getCustomer().getEmail()))
            .replace(
                "{{reservationDate}}",
                escape(reservation.getDatetime().toLocalDate().format(RESERVATION_DATE_FORMAT))
            )
            .replace("{{startTime}}", escape(String.valueOf(reservation.getStartTime())))
            .replace("{{endTime}}", escape(String.valueOf(reservation.getEndTime())))
            .replace("{{partySize}}", escape(String.valueOf(reservation.getPartySize())))
            .replace("{{details}}", escape(reservation.getDetails()));
    }

    private String loadTemplate(String fileName) {
        ClassPathResource template =
            new ClassPathResource("templates/" + fileName);

        try (var input = template.getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException(
                "Could not load email template: " + fileName, e
            );
        }
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }
}
