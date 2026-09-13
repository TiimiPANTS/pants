package com.pants.backend.dto;

import java.time.LocalDateTime;

public class ReceiptDTO {

    private Integer receiptId;
    private ReservationDTO reservation;
    private LocalDateTime issued;

    public ReceiptDTO(){

    }

    public Integer getReceiptId() {
        return receiptId;
    }

    public void setReceiptId(Integer receiptId){
        this.receiptId = receiptId;
    }

    public ReservationDTO getReservation(){
        return reservation;
    }

    public void setReservation(ReservationDTO reservation) {
        this.reservation = reservation;
    }

    public LocalDateTime getIssued() {
        return issued;
    }

    public void setIssued(LocalDateTime issued) {
        this.issued = issued;
    }
}
