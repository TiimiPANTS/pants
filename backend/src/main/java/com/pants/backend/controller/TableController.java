package com.pants.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.entity.RestaurantTable;
import com.pants.backend.repository.TableRepository;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/tables")

public class TableController {

    private final TableRepository tableRepository;

    public TableController(TableRepository tableRepository) {
        this.tableRepository = tableRepository;
    }

    @GetMapping
    public List<RestaurantTable> getAllTables() {
        return tableRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public RestaurantTable getTable(@PathVariable Long id) {
        return tableRepository.findById(id).orElseThrow();
    }

    @PostMapping
    public RestaurantTable createTable (@RequestBody RestaurantTable table) {
        return tableRepository.save(table);
    }
    
    @PutMapping("/{id}")
    public RestaurantTable updateTable(@PathVariable Long id, @RequestBody RestaurantTable table) {

        RestaurantTable existingTable = tableRepository.findById(id).orElseThrow();

        existingTable.setTableNumber(table.getTableNumber());
        existingTable.setCapacity(table.getCapacity());

        return tableRepository.save(existingTable);
    }

    @DeleteMapping("/{id}")
    public void deleteTable(@PathVariable Long id) {
        tableRepository.deleteById(id);
    }

}