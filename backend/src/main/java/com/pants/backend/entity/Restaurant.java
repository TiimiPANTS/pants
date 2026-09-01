package com.pants.backend.entity;

// Ei tarvii vielä, mutta voidaan pitää

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Restaurant {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

private String name;        // Ravintolan nimi

private String address;     // Ravintolan osoite

private String phone;       // Ravintolan puhelinnumero

private String email;       // Ravintolan sähköposti

public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

public String getName() {
    return name;
}

public void setName(String name) {
    this.name = name;
}

public String getAddress() {
    return address;
}

public void setAddress(String address) {
    this.address = address;
}

public String getPhone() {
    return phone;
}

public void setPhone(String phone) {
    this.phone = phone;
}

public String getEmail() {
    return email;
}

public void setEmail(String email) {
    this.email = email;
}
}
