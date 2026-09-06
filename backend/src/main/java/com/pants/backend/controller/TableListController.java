package com.pants.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

// validoin TABLE idn jossain vaiheesm kun se controller ja entity on tehty

@RestController
@RequestMapping("/tablelist")
@Tag(name = "TableList API", description = "Endpoints for managing tables within a reservation")
public class TableListController {

    private final TableListRepository tableListRepository;
    private final ReservationRepository reservationRepository;

    public TableListController(TableListRepository tableListRepository, ReservationRepository reservationRepository) {
        this.tableListRepository = tableListRepository;
        this.reservationRepository = reservationRepository;
    }

    @Operation(summary = "Get all tablelists", description = "Returns all tablelist records")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All tablelists found successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TableList.class))),
            @ApiResponse(responseCode = "404", description = "No tablelists found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class)))
    })
    @GetMapping
    public ResponseEntity<?> getAll() {

        List<TableList> tableLists = tableListRepository.findAll();

        if (tableLists.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(404, "No tablelists found"));
        }

        return ResponseEntity.ok(tableLists);
    }

    @Operation(summary = "Get tablelist by ID", description = "Returns a tablelist by reservationId and tableId")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tablelist found successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TableList.class))),
            @ApiResponse(responseCode = "404", description = "Tablelist not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))) })
    @GetMapping("/{reservationId}/{tableId}")
    public ResponseEntity<?> getById(
            @PathVariable Integer reservationId,
            @PathVariable Integer tableId) {

        TableListId id = new TableListId(reservationId, tableId);

        return tableListRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse(404, "Tablelist not found")));
    }

    @Operation(summary = "Create tablelist", description = "Creates a tablelist with reservationId and tableId")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Tablelist created successfully", content = @Content(mediaType = "application/json", schema = @Schema(implementation = TableList.class))),
            @ApiResponse(responseCode = "400", description = "Invalid tablelist data", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Reservation not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))) })
    @PostMapping
    public ResponseEntity<?> create(@RequestBody TableList tableList) {

        Integer reservationId = tableList.getId().getReservationId();

        // muutetaan datatyyppi Integer, kosk primary key on vaan numeroit. Tää tekee
        // postgrest nopeemmaan
        // if (!reservationRepository.existsById(reservationId)) {
        Long reservationIdLong = reservationId.longValue();

        if (!reservationRepository.existsById(reservationIdLong)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "Reservation with id " + reservationId + " does not exist"));
        }

        if (tableListRepository.existsById(tableList.getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "Tablelist already exists"));

        }

        TableList saved = tableListRepository.save(tableList);

        return ResponseEntity
                .status(HttpStatus.CREATED).body(saved);
    }

    @Operation(summary = "Delete tablelist by ID", description = "Deletes a tablelist by reservationId and tableId")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Tablelist deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Tablelist not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))) })
    @DeleteMapping("/{reservationId}/{tableId}")
    public ResponseEntity<?> delete(
            @PathVariable Integer reservationId,
            @PathVariable Integer tableId) {

        TableListId id = new TableListId(reservationId, tableId);

        if (tableListRepository.existsById(id)) {
            tableListRepository.deleteById(id);

            return ResponseEntity.ok(Map.of("message", "Tablelist deleted successfully"));
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(404, "Tablelist not found"));

    }
}