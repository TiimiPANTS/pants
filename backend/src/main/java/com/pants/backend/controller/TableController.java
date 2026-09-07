package com.pants.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.entity.Table;
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
    public List<Table> getAllTables() {
        return tableRepository.findAll();
    }

    @GetMapping("/{id}")
    public Table getTable(@PathVariable Integer id) {
        return tableRepository.findById(id).orElseThrow();
    }

    @PostMapping
    public Table createTable(@RequestBody Table table) {
        return tableRepository.save(table);
    }

    @PutMapping("/{id}")
    public Table updateTable(@PathVariable Integer id, @RequestBody Table table) {

        Table existingTable = tableRepository.findById(id).orElseThrow();

        existingTable.setTableNumber(table.getTableNumber());
        existingTable.setCapacity(table.getCapacity());

        return tableRepository.save(existingTable);
    }

    @DeleteMapping("/{id}")
    public void deleteTable(@PathVariable Integer id) {
        tableRepository.deleteById(id);
    }

}