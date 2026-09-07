package com.pants.backend.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.RestaurantTable;
import com.pants.backend.entity.TableList;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.repository.TableRepository;

// Pöytien kapasiteettiin ja saatavuuteen liittyvä sovelluslogiikka:
// mikä pöytä sopii tietylle henkilömäärälle ja onko se jo varattu kyseiselle ajalle
@Service
public class TableService {

    private final TableRepository tableRepository;
    private final TableListRepository tableListRepository;
    private final ReservationRepository reservationRepository;

    public TableService(
            TableRepository tableRepository,
            TableListRepository tableListRepository,
            ReservationRepository reservationRepository
    ) {
        this.tableRepository = tableRepository;
        this.tableListRepository = tableListRepository;
        this.reservationRepository = reservationRepository;
    }

    // Palauttaa pöydät, joiden kapasiteetti riittää seuralle ja jotka ovat vapaana annetulle ajalle
    public List<RestaurantTable> findAvailableTables(
            int partySize,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime
    ) {
        return tableRepository.findByCapacityGreaterThanEqual(partySize).stream()
                .filter(table -> isAvailable(table.getId(), datetime, startTime, endTime))
                .toList();
    }

    // Riittääkö pöydän kapasiteetti annetulle henkilömäärälle?
    public boolean hasCapacityFor(RestaurantTable table, int partySize) {
        return table.getCapacity() >= partySize;
    }

    // Onko pöytä vapaana annettuna päivänä ja kellonaikana, eli ei päällekkäistä varausta
    public boolean isAvailable(
            Long tableId,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime
    ) {
        List<TableList> assignments = tableListRepository.findByIdTableId(tableId.intValue());

        for (TableList assignment : assignments) {
            Integer reservationId = assignment.getId().getReservationId();

            Reservation reservation = reservationRepository.findById(reservationId.longValue()).orElse(null);

            if (reservation != null && overlaps(reservation, datetime, startTime, endTime)) {
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
