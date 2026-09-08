package com.pants.backend.utils;

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

    public static Reservation createReservation() {
        Reservation reservation = new Reservation();
        reservation.setPartySize(4);
        return reservation;
    }

    public static TableList createTableList() {
        TableList tableList = new TableList();
        tableList.setId(new TableListId(1, 1));
        return tableList;
    }
}