package com.pants.backend.service;

import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.ReservationRepository;
import org.springframework.stereotype.Service;

@Service
public class ReceiptService {

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

        String html = buildReceiptHtml(reservation);

        emailService.sendHtmlEmail(
                reservation.getCustomer().getEmail(),
                "Reservation Confirmation #" + reservation.getReservationId(),
                html);
    }

    private String buildReceiptHtml(Reservation reservation) {

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                </head>
                <body style="font-family: Arial, sans-serif;">

                    <h2>Reservation Confirmation</h2>

                    <p>
                        Thank you for your reservation.
                        Here are your booking details:
                    </p>

                    <table border="1" cellpadding="8" cellspacing="0">
                        <tr>
                            <th align="left">Reservation ID</th>
                            <td>%d</td>
                        </tr>

                        <tr>
                            <th align="left">Customer</th>
                            <td>%s %s</td>
                        </tr>

                        <tr>
                            <th align="left">Email</th>
                            <td>%s</td>
                        </tr>

                        <tr>
                            <th align="left">Created</th>
                            <td>%s</td>
                        </tr>

                        <tr>
                            <th align="left">Start Time</th>
                            <td>%s</td>
                        </tr>

                        <tr>
                            <th align="left">End Time</th>
                            <td>%s</td>
                        </tr>

                        <tr>
                            <th align="left">Party Size</th>
                            <td>%d guests</td>
                        </tr>

                        <tr>
                            <th align="left">Status</th>
                            <td>%s</td>
                        </tr>

                        <tr>
                            <th align="left">Details</th>
                            <td>%s</td>
                        </tr>
                    </table>

                    <br>

                    <p>
                        We look forward to serving you.
                    </p>

                </body>
                </html>
                """.formatted(
                reservation.getReservationId(),
                reservation.getCustomer().getFirstname(),
                reservation.getCustomer().getLastname(),
                reservation.getCustomer().getEmail(),
                reservation.getDatetime(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                reservation.getPartySize(),
                reservation.getStatus().getName(),
                reservation.getDetails());
    }
}