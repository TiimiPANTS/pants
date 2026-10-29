package com.pants.backend.dto;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class TableDTO {

    private Integer id;

        @NotNull(message = "Table number is required")
    @Min(value = 1, message = "Table number must be at least 1")
    private Integer tableNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

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

    public void setTableNumber(int tableNumber) {
        this.tableNumber = tableNumber;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }
}
