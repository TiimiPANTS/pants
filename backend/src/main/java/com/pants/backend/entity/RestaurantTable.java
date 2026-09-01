package com.pants.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "TABLES")
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "table_id")
    private Long id;

    @Column(name = "table_number")
    private int tableNumber;

    @Column(name = "capacity")
    private int capacity;

    // @ManyToOne
    // @JoinColumn(name = "tstatus_id")
    // private TStatus status; // TStatus herjaa, koska table status entity tekemättä

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(int tableNumber) {
        this.tableNumber = tableNumber;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    // public TStatus getStatus() {     // TStatus herjaa, koska table status entity tekemättä
    //     return status;
    // }

    // public void setStatus(TStatus status) {      // TStatus herjaa, koska table status entity tekemättä
    //     this.status = status;
    // }
}
