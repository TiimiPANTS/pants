package com.pants.backend.entity;

import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "RESERVATIONS")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reservation_id")
    private Long reservationId;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "starttime")
    private LocalTime starttime;

    @Column(name = "endtime")
    private LocalTime endtime;

    @Column(name = "datetime")
    private LocalDateTime datetime;

    @Column(name = "party_size")
    private Integer partysize;

    @Column(name = "details")
    private String details;

    // @ManyToOne
    // @JoinColumn(name ="status_id")
    // private RStatus status; // RStatus herjaa, koska reservation status entity tekemättä

    public Reservation(){
    }

    public Long reservationId(){
        return reservationId;
    }

    public void setReservationId(Long reservationId){
        this.reservationId = reservationId;
    }

    public Customer getCustomer(){
        return customer;
    }

    public void setCustomer(Customer customer){
        this.customer = customer;
    }

    public LocalTime getStartTime(){
        return starttime;
    }

    public void setStarttime(LocalTime starttime){
        this.starttime = starttime;
    }

    public LocalTime getEndTime(){
        return endtime;
    }

    public void setEndtime(LocalTime endtime){
        this.endtime = endtime;
    }

    public LocalDateTime getDatetime(){
        return datetime;
    }

    public void setDatetime(LocalDateTime datetime){
        this.datetime = datetime;
    }

    public Integer getPartySize(){
        return partysize;
    }

    public void setPartySize(Integer partysize){
        this.partysize = partysize;
    }

    public String getDetails(){
        return details;
    }

    public void setDetails(String details){
        this.details = details;
    }

    // public RStatus getStatus(){     // RStatus herjaa, koska reservation status entity tekemättä
    //     return status;
    // }

    // public void setStatus(RStatus status){      // RStatus herjaa, koska reservation status entity tekemättä
    //     this.status = status;
    // }

}
