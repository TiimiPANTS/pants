package com.pants.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Customer customer;         // kuka varasi

    @ManyToOne
    private RestaurantTable table;     // minkä pöydän varasi

    private LocalDateTime time;        // milloin (päivä ja kellonaika)
    private int guests;                // montako henkilöä

}
