package com.pants.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "TABLELIST")
public class TableList {

    @EmbeddedId
    private TableListId id;

    public TableList() {
    }

    public TableList(Integer reservationId, Integer tableId) {
        this.id = new TableListId(reservationId, tableId);
    }

    public TableListId getId() {
        return id;
    }

    public void setId(TableListId id) {
        this.id = id;
    }

    @Embeddable
    public static class TableListId implements Serializable {

        @Column(name = "reservation_id")
        private Integer reservationId;

        @Column(name = "table_id")
        private Integer tableId;

        public TableListId() {
        }

        public TableListId(Integer reservationId, Integer tableId) {
            this.reservationId = reservationId;
            this.tableId = tableId;
        }

        public Integer getReservationId() {
            return reservationId;
        }

        public void setReservationId(Integer reservationId) {
            this.reservationId = reservationId;
        }

        public Integer getTableId() {
            return tableId;
        }

        public void setTableId(Integer tableId) {
            this.tableId = tableId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o)
                return true;
            if (!(o instanceof TableListId))
                return false;

            TableListId that = (TableListId) o;

            return Objects.equals(reservationId, that.reservationId)
                    && Objects.equals(tableId, that.tableId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(reservationId, tableId);
        }
    }
}