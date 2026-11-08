package com.pants.backend.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
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

// Pöytien kapasiteettiin ja saatavuuteen liittyvä sovelluslogiikka:
// mikä pöytä sopii tietylle henkilömäärälle ja onko se jo varattu kyseiselle ajalle
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

    // Riittääkö pöydän kapasiteetti annetulle henkilömäärälle?
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

    // Onko pöytä vapaana annettuna päivänä ja kellonaikana, eli ei päällekkäistä varausta
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

        // Kaksi aikaväliä menevät päällekkäin jos kumpikin alkaa ennen kuin toinen päättyy
        return startTime.isBefore(existing.getEndTime()) && existing.getStartTime().isBefore(endTime);
    }
}
