package com.pants.backend.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.pants.backend.entity.RStatus;
import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.Table;
import com.pants.backend.entity.TableList;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.RStatusRepository;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.repository.TableRepository;

@Service
public class TableService {

    private final TableRepository tableRepository;
    private final TableListRepository tableListRepository;
    private final ReservationRepository reservationRepository;
    private final RStatusRepository rStatusRepository;

    public TableService(
            TableRepository tableRepository,
            TableListRepository tableListRepository,
            ReservationRepository reservationRepository,
            RStatusRepository rStatusRepository
    ) {
        this.tableRepository = tableRepository;
        this.tableListRepository = tableListRepository;
        this.reservationRepository = reservationRepository;
        this.rStatusRepository = rStatusRepository;
    }

    public boolean hasCapacityFor(Table table, int partySize) {
        return table.getCapacity() >= partySize;
    }

    public List<Table> findAvailableTables(
            int partySize,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime
    ) {
        return findAvailableTables(partySize, datetime, startTime, endTime, null);
    }

    public List<Table> findAvailableTables(
            int partySize,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime,
            Integer ignoreReservationId
    ) {
        return tableRepository.findByCapacityGreaterThanEqualOrderByCapacityAsc(partySize).stream()
                .filter(table -> isAvailable(table.getId(), datetime, startTime, endTime, ignoreReservationId))
                .toList();
    }

    public List<Table> findTableCombination(
            int partySize,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime
    ) {
        return findTableCombination(partySize, datetime, startTime, endTime, null);
    }

    public List<Table> findTableCombination(
            int partySize,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime,
            Integer ignoreReservationId
    ) {
        List<Table> freeTables = tableRepository.findAll().stream()
                .filter(table -> isAvailable(table.getId(), datetime, startTime, endTime, ignoreReservationId))
                .sorted(Comparator.comparingInt(Table::getCapacity).reversed()
                        .thenComparing(Table::getId))
                .toList();

        int totalSeats = freeTables.stream().mapToInt(Table::getCapacity).sum();
        if (totalSeats < partySize) {
            return List.of();
        }

        List<Table> remaining = new ArrayList<>(freeTables);
        List<Table> chosen = new ArrayList<>();
        int needed = partySize;
        while (needed > 0) {
            final int stillNeeded = needed;
            Table next = remaining.stream()
                    .filter(table -> table.getCapacity() >= stillNeeded)
                    .min(Comparator.comparingInt(Table::getCapacity).thenComparing(Table::getId))
                    .orElse(remaining.getFirst());
            remaining.remove(next);
            chosen.add(next);
            needed -= next.getCapacity();
        }

        chosen.sort(Comparator.comparing(Table::getId));
        return chosen;
    }

    public boolean isAvailable(
            Integer tableId,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime
    ) {
        return isAvailable(tableId, datetime, startTime, endTime, null);
    }

    private boolean isAvailable(
            Integer tableId,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime,
            Integer ignoreReservationId
    ) {
        List<TableList> assignments = tableListRepository.findByIdTableId(tableId);

        if (assignments.isEmpty()) {
            return true;
        }

        RStatus cancelledStatus = rStatusRepository.findById(3)
                .orElseThrow(() -> new IllegalStateException("Reservation status with ID 3 missing"));

        List<Integer> reservationIds = assignments.stream()
                .map(assignment -> assignment.getId().getReservationId())
                .toList();
        List<Reservation> reservations = reservationRepository.findAllById(reservationIds);

        for (Reservation reservation : reservations) {
            if (ignoreReservationId != null && ignoreReservationId.equals(reservation.getReservationId())) {
                continue;
            }
            if ((reservation.getStatus() == null
                    || !cancelledStatus.getId().equals(reservation.getStatus().getId()))
                    && overlaps(reservation, datetime, startTime, endTime)) {
                return false;
            }
        }

        return true;
    }

    private boolean overlaps(
            Reservation existing,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime
    ) {
        boolean sameDay = existing.getDatetime() != null
                && datetime != null
                && existing.getDatetime().toLocalDate().equals(datetime.toLocalDate());

        if (!sameDay || existing.getStartTime() == null || existing.getEndTime() == null) {
            return false;
        }

        return startTime.isBefore(existing.getEndTime()) && existing.getStartTime().isBefore(endTime);
    }
}
