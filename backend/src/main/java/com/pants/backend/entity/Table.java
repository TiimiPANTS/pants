package com.pants.backend.entity;

import jakarta.persistence.*;

@Entity
@jakarta.persistence.Table(name = "TABLES")
public class Table {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "table_id")
    private Integer id;

    @Column(name = "table_number")
    private int tableNumber;

    @Column(name = "capacity")
    private int capacity;

    @ManyToOne
    @JoinColumn(name = "tstatus_id")
    private TStatus status;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
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

    public TStatus getStatus() {
        return status;
    }

    public void setStatus(TStatus status) {
        this.status = status;
    }

}
