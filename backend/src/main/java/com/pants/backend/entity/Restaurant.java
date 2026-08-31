package com.pants.backend.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Restaurant {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

private String name;

private String address;

private String phone;

private String email;

@OneToMany (mappedBy = "restaurant")
private List <RestaurantTable> tables;
}
