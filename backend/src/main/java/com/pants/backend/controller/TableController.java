package com.pants.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.entity.Table;
import com.pants.backend.repository.TableRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.Map;

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
    public ResponseEntity<?> getAllTables() {
        List<Table> tables = tableRepository.findAll();

        if (tables.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "No tables found"));
        }

        return ResponseEntity.ok(tables);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTable(@PathVariable Integer id) {
        return tableRepository.findById(id)
                .map(table -> ResponseEntity.ok((Object) table))
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse(404, "Table not found")));
    }

    @PostMapping
    public ResponseEntity<?> createTable(@RequestBody Table table) {
        try {
            Table savedTable = tableRepository.save(table);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(savedTable);
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "Invalid table data: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTable(@PathVariable Integer id, @RequestBody Table table) {

        Table existingTable = tableRepository.findById(id).orElse(null);

        if (existingTable == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "Table not found"));
        }

        existingTable.setTableNumber(table.getTableNumber());
        existingTable.setCapacity(table.getCapacity());

        Table updatedTable = tableRepository.save(existingTable);

        return ResponseEntity.ok(updatedTable);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTable(@PathVariable Integer id) {

        if (tableRepository.existsById(id)) {
            tableRepository.deleteById(id);

            return ResponseEntity.ok(Map.of("message", "Successfully deleted table with id " + id));
        }

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "Table not found"));
    }

}
