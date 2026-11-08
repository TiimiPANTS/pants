package com.pants.backend.utils;

import java.time.LocalDateTime;
import java.time.LocalTime;

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.Table;
import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;

public final class TestDataFactory {

    private TestDataFactory() {}

    public static Table createTable() {
        Table table = new Table();
        table.setId(1);
        return table;
    }

    public static Table createTable(int capacity) {
        Table table = new Table();
        table.setCapacity(capacity);
        return table;
    }

    public static Table createTable(int id, int capacity) {
        Table table = createTable(capacity);
        table.setId(id);
        return table;
    }

    public static Reservation createReservation() {
        Reservation reservation = new Reservation();
        reservation.setPartySize(4);
        return reservation;
    }

    public static Reservation createReservation(
            int id, LocalDateTime datetime, LocalTime start, LocalTime end) {
        Reservation reservation = createReservation();
        reservation.setReservationId(id);
        reservation.setDatetime(datetime);
        reservation.setStartTime(start);
        reservation.setEndTime(end);
        return reservation;
    }

    public static ReservationDTO createReservationRequest(
            String email, LocalDateTime datetime, LocalTime start, LocalTime end, int partySize) {
        ReservationDTO dto = new ReservationDTO();
        dto.setCustomer(new CustomerDTO(null, "Test", "User", email));
        dto.setDatetime(datetime);
        dto.setStartTime(start);
        dto.setEndTime(end);
        dto.setPartySize(partySize);
        return dto;
    }

    public static TableList createTableList() {
        return createTableList(1, 1);
    }

    public static TableList createTableList(int reservationId, int tableId) {
        TableList tableList = new TableList();
        tableList.setId(new TableListId(reservationId, tableId));
        return tableList;
    }
}
