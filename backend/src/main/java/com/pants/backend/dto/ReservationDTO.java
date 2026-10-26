package com.pants.backend.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class ReservationDTO {

    @Valid 
    @NotNull
    private CustomerDTO customer;

    @NotNull
    @Schema(type = "string", example = "19:00")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @NotNull
    @Schema(type = "string", example = "21:00")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    @NotNull
    @Future
    @Schema(type = "string", example = "01.12.2026 19:00")
    @JsonFormat(pattern = "dd.MM.yyyy HH:mm")
    private LocalDateTime datetime;

    @NotNull 
    @Min(1)
    @Max(10)
    @Schema(example = "2")
    private Integer partySize;

    @Size(max = 500)
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