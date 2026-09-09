package com.pants.backend.entity;

import jakarta.persistence.*;
import jakarta.persistence.Table;

@Entity
@Table(name = "R_STATUS")
public class RStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rstatus_id")
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;

    public RStatus() {
    }

    public RStatus(String name) {
        this.name = name;
    }

    // Getters & Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
