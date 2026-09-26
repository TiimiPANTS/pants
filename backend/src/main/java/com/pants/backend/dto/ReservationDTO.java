package com.pants.backend.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

import io.swagger.v3.oas.annotations.media.Schema;

public class ReservationDTO {

    private CustomerDTO customer;

    @Schema(type = "string", example = "19:00:00")
    private LocalTime startTime;

    @Schema(type = "string", example = "21:00:00")
    private LocalTime endTime;

    @Schema(type = "string", example = "2026-12-01T19:00:00")
    private LocalDateTime datetime;

    @Schema(example = "2")
    private Integer partySize;

    @Schema(example = "Window seat please")
    private String details;

    public ReservationDTO() {
    }

    public CustomerDTO getCustomer() {
        return customer;
    }

    public void setCustomer(CustomerDTO customer) {
        this.customer = customer;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public LocalDateTime getDatetime() {
        return datetime;
    }

    public void setDatetime(LocalDateTime datetime) {
        this.datetime = datetime;
    }

    public Integer getPartySize() {
        return partySize;
    }

    public void setPartySize(Integer partySize) {
        this.partySize = partySize;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}