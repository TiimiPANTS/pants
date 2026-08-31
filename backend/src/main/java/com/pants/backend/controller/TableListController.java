package com.pants.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;
import com.pants.backend.repository.TableListRepository;

@RestController
@RequestMapping("/tablelist")
public class TableListController {

    private final TableListRepository tableListRepository;

    public TableListController(TableListRepository tableListRepository) {
        this.tableListRepository = tableListRepository;
    }

    @GetMapping
    public List<TableList> getAll() {
        return tableListRepository.findAll();
    }

    @GetMapping("/{reservationId}/{tableId}")
    public ResponseEntity<TableList> getById(
            @PathVariable Integer reservationId,
            @PathVariable Integer tableId) {

        TableListId id = new TableListId(reservationId, tableId);

        return tableListRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TableList create(@RequestBody TableList tableList) {
        return tableListRepository.save(tableList);
    }

    @DeleteMapping("/{reservationId}/{tableId}")
    public ResponseEntity<Void> delete(
            @PathVariable Integer reservationId,
            @PathVariable Integer tableId) {

        TableListId id = new TableListId(reservationId, tableId);

        if (!tableListRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        tableListRepository.deleteById(id);

        return ResponseEntity.noContent().build();
    }
}