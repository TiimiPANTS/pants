package com.pants.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

public class ReservationAvailabilityDTO {

    private final LocalDate date;

    @JsonFormat(pattern = "HH:mm")
    private final LocalTime startTime;
    private final int availableCapacity;

    public ReservationAvailabilityDTO(
        LocalDate date,
        LocalTime startTime,
        int availableCapacity
    ) {
        this.date = date;
        this.startTime = startTime;
        this.availableCapacity = availableCapacity;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public int getAvailableCapacity() {
        return availableCapacity;
    }
}
