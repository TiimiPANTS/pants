package com.pants.backend.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;  // litistää varauksen kentät samalle tasolle
import com.pants.backend.entity.Reservation;

public class ReservationResponse {
    private final Reservation reservation;

    public ReservationResponse(Reservation reservation) {
        this.reservation = reservation;
    }

    @JsonUnwrapped
    public Reservation getReservation() {
        return reservation;
    }

    public String getEditToken() {
        return reservation.getEditToken();
    }
}
