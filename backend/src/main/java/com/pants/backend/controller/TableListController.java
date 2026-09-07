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
import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.RestaurantTable;
import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.repository.TableRepository;
import com.pants.backend.service.TableService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/tablelists")
@Tag(name = "TableList API", description = "Endpoints for managing tables within a reservation")
public class TableListController {

    private final TableListRepository tableListRepository;
    private final ReservationRepository reservationRepository;
    private final TableRepository tableRepository;
    private final TableService tableService;

    public TableListController(
            TableListRepository tableListRepository,
            ReservationRepository reservationRepository,
            TableRepository tableRepository,
            TableService tableService
    ) {
        this.tableListRepository = tableListRepository;
        this.reservationRepository = reservationRepository;
        this.tableRepository = tableRepository;
        this.tableService = tableService;
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
            @ApiResponse(responseCode = "404", description = "Reservation or table not found", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "409", description = "Table already reserved for that time", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))) })
    @PostMapping
    public ResponseEntity<?> create(@RequestBody TableList tableList) {

        // muutetaan datatyyppi Integer, kosk primary key on vaan numeroit. Tää tekee
        // postgrest nopeemmaan
        Integer reservationId = tableList.getId().getReservationId();
        Integer tableId = tableList.getId().getTableId();

        Reservation reservation = reservationRepository.findById(reservationId.longValue()).orElse(null);

        if (reservation == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "Reservation with id " + reservationId + " does not exist"));
        }

        RestaurantTable table = tableRepository.findById(tableId.longValue()).orElse(null);

        if (table == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "Table with id " + tableId + " does not exist"));
        }

        if (tableListRepository.existsById(tableList.getId())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "Tablelist already exists"));

        }

        if (!tableService.hasCapacityFor(table, reservation.getPartySize())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400,
                            "Table with id " + tableId + " does not have enough capacity for party size "
                                    + reservation.getPartySize()));
        }

        if (!tableService.isAvailable(table.getId(), reservation.getDatetime(), reservation.getStartTime(),
                reservation.getEndTime())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(409, "Table with id " + tableId + " is already reserved for that time"));
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