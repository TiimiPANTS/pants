package com.pants.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.entity.Table;
import com.pants.backend.repository.TableRepository;

@ExtendWith(MockitoExtension.class)
class TableControllerTest {

    @Mock
    private TableRepository tableRepository;

    @InjectMocks
    private TableController tableController;

    private static Table createTable() {
        Table table = new Table();
        table.setId(1);
        table.setTableNumber(1);
        table.setCapacity(4);
        return table;
    }

    private static Table createTable(int id, int tableNumber, int capacity) {
        Table table = new Table();
        table.setId(id);
        table.setTableNumber(tableNumber);
        table.setCapacity(capacity);
        return table;
    }

    private static void assertErrorResponse(
            ResponseEntity<?> response,
            HttpStatus status,
            String message
    ) {
        assertThat(response.getStatusCode()).isEqualTo(status);

        ErrorResponse error = (ErrorResponse) response.getBody();

        assertThat(error).isNotNull();
        assertThat(error.getStatus()).isEqualTo(status.value());
        assertThat(error.getMessage()).isEqualTo(message);
    }

    @Test
    void getAll_whenTablesExist_returnsOk() {
        Table first = createTable();
        Table second = createTable(2, 2, 6);

        when(tableRepository.findAll())
                .thenReturn(List.of(first, second));

        ResponseEntity<?> response = tableController.getAllTables();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(List.of(first, second));

        verify(tableRepository).findAll();
    }

    @Test
    void getAll_whenNoTablesExist_returnsNotFound() {
        when(tableRepository.findAll())
                .thenReturn(Collections.emptyList());

        ResponseEntity<?> response = tableController.getAllTables();

        assertErrorResponse(
                response,
                HttpStatus.NOT_FOUND,
                "No tables found"
        );

        verify(tableRepository).findAll();
    }

    @Test
    void getById_whenFound_returnsOk() {
        Table table = createTable();

        when(tableRepository.findById(1))
                .thenReturn(Optional.of(table));

        ResponseEntity<?> response = tableController.getTable(1);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(table);

        verify(tableRepository).findById(1);
    }

    @Test
    void getById_whenNotFound_returnsNotFound() {
        when(tableRepository.findById(99))
                .thenReturn(Optional.empty());

        ResponseEntity<?> response = tableController.getTable(99);

        assertErrorResponse(
                response,
                HttpStatus.NOT_FOUND,
                "Table not found"
        );

        verify(tableRepository).findById(99);
    }

    @Test
    void create_whenValid_returnsCreated() {
        Table table = createTable();

        when(tableRepository.save(table))
                .thenReturn(table);

        ResponseEntity<?> response = tableController.createTable(table);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        assertThat(response.getBody())
                .isEqualTo(table);

        verify(tableRepository).save(table);
    }

    @Test
    void create_whenRepositoryThrows_returnsBadRequest() {
        Table table = createTable();

        when(tableRepository.save(table))
                .thenThrow(new RuntimeException("Database error"));

        ResponseEntity<?> response = tableController.createTable(table);

        assertErrorResponse(
                response,
                HttpStatus.BAD_REQUEST,
                "Invalid table data: Database error"
        );

        verify(tableRepository).save(table);
    }


    @Test
    void update_whenFound_returnsOk() {
        Table existingTable = createTable();

        Table updatedTable = createTable(
                1,
                5,
                8
        );

        when(tableRepository.findById(1))
                .thenReturn(Optional.of(existingTable));

        when(tableRepository.save(existingTable))
                .thenReturn(updatedTable);

        ResponseEntity<?> response =
                tableController.updateTable(1, updatedTable);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.OK);

        assertThat(response.getBody())
                .isEqualTo(updatedTable);

        assertThat(existingTable.getTableNumber())
                .isEqualTo(5);

        assertThat(existingTable.getCapacity())
                .isEqualTo(8);

        verify(tableRepository).findById(1);
        verify(tableRepository).save(existingTable);
    }

    @Test
    void update_whenNotFound_returnsNotFound() {
        Table table = createTable();

        when(tableRepository.findById(99))
                .thenReturn(Optional.empty());

        ResponseEntity<?> response =
                tableController.updateTable(99, table);

        assertErrorResponse(
                response,
                HttpStatus.NOT_FOUND,
                "Table not found"
        );

        verify(tableRepository).findById(99);
        verify(tableRepository, never()).save(any());
    }

    @Test
    void delete_whenFound_returnsOk() {
        when(tableRepository.existsById(1))
                .thenReturn(true);

        ResponseEntity<?> response =
                tableController.deleteTable(1);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.OK);

        assertThat(response.getBody())
                .isEqualTo(
                        java.util.Map.of(
                                "message",
                                "Successfully deleted table with id 1"
                        )
                );

        verify(tableRepository).existsById(1);
        verify(tableRepository).deleteById(1);
    }

    @Test
    void delete_whenNotFound_returnsNotFound() {
        when(tableRepository.existsById(99))
                .thenReturn(false);

        ResponseEntity<?> response =
                tableController.deleteTable(99);

        assertErrorResponse(
                response,
                HttpStatus.NOT_FOUND,
                "Table not found"
        );

        verify(tableRepository).existsById(99);
        verify(tableRepository, never()).deleteById(anyInt());
    }
}