package com.pants.backend.dto;
import jakarta.validation.constraints.Min;

public class TableDTO {

    private Integer id;

    @Min(1)
    private int tableNumber;
    @Min(1)
    private int capacity;

    public TableDTO() {
    }

    public TableDTO(Integer id, Integer tableNumber, Integer capacity) {
        this.id = id;
        this.tableNumber = tableNumber;
        this.capacity = capacity;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(Integer tableNumber) {
        this.tableNumber = tableNumber;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
}
