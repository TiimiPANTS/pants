package com.pants.backend.entity;

import jakarta.persistence.*;
import jakarta.persistence.Table;

@Entity
@Table(name = "T_STATUS")
public class TStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tstatus_id")
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;

    public TStatus() {
    }

    public TStatus(String name) {
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
