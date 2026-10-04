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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/tables")
@Tag(name = "Table API", description = "Endpoints for managing tables")

public class TableController {

    private final TableRepository tableRepository;

    public TableController(TableRepository tableRepository) {
        this.tableRepository = tableRepository;
    }

    @Operation(summary = "Get all tables", description = "Returns a list of all tables")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All tables found successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Table.class))),
            @ApiResponse(responseCode = "404", description = "No tables found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })

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

    @Operation(summary = "Get table by ID", description = "Returns a single table by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Table found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Table.class))),
            @ApiResponse(responseCode = "404", description = "Table not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })

    @GetMapping("/{id}")
    public ResponseEntity<?> getTable(@PathVariable Integer id) {
        return tableRepository.findById(id)
                .map(table -> ResponseEntity.ok((Object) table))
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse(404, "Table not found")));
    }

    @Operation(summary = "Create a new table", description = "Adds a new table to the system")

    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Table created successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Table.class))),
            @ApiResponse(responseCode = "400", description = "Invalid table data", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })

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

    @Operation(summary = "Update an existing table", description = "Updates information for an existing table")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Table updated successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = Table.class))),
            @ApiResponse(responseCode = "404", description = "Table not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })

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

    @Operation(summary = "Delete table by ID", description = "Deletes a single table by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Table deleted successfully", content = @Content(mediaType = "application/json", schema = @Schema(type = "object", example = "{\"message\": \"Successfully deleted table with id 1\"}"))),
            @ApiResponse(responseCode = "404", description = "Table not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })

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
