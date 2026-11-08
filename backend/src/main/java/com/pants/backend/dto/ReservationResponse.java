package com.pants.backend.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.pants.backend.entity.Customer;
import com.pants.backend.entity.Reservation;

import io.swagger.v3.oas.annotations.media.Schema;

public class ReservationResponse {

    private final Integer reservationId;
    private final CustomerDTO customer;

    @Schema(type = "string", example = "18:00")
    @JsonFormat(pattern = "HH:mm")
    private final LocalTime startTime;

    @Schema(type = "string", example = "20:00")
    @JsonFormat(pattern = "HH:mm")
    private final LocalTime endTime;

    @Schema(type = "string", example = "21.09.2026 18:00")
    @JsonFormat(pattern = "dd.MM.yyyy HH:mm")
    private final LocalDateTime datetime;

    private final Integer partySize;
    private final String details;
    private final StatusDTO status;
    private final String editToken;

    public ReservationResponse(Reservation reservation) {
        this.reservationId = reservation.getReservationId();
        this.customer = toCustomerDTO(reservation.getCustomer());
        this.startTime = reservation.getStartTime();
        this.endTime = reservation.getEndTime();
        this.datetime = reservation.getDatetime();
        this.partySize = reservation.getPartySize();
        this.details = reservation.getDetails();
        this.status = reservation.getStatus() == null
                ? null
                : new StatusDTO(reservation.getStatus().getId(), reservation.getStatus().getName());
        this.editToken = reservation.getEditToken();
    }

    private static CustomerDTO toCustomerDTO(Customer c) {
        if (c == null) {
            return null;
        }
        return new CustomerDTO(c.getId(), c.getFirstname(), c.getLastname(), c.getEmail());
    }

    // Statuksen pieni sisäinen DTO: {"id": 1, "name": "PENDING"}
    public record StatusDTO(Integer id, String name) {
    }

    public Integer getReservationId() { return reservationId; }
    public CustomerDTO getCustomer() { return customer; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public LocalDateTime getDatetime() { return datetime; }
    public Integer getPartySize() { return partySize; }
    public String getDetails() { return details; }
    public StatusDTO getStatus() { return status; }
    public String getEditToken() { return editToken; }
}

