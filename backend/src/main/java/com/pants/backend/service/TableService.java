package com.pants.backend.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.Table;
import com.pants.backend.entity.TableList;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;

// Pöytien kapasiteettiin ja saatavuuteen liittyvä sovelluslogiikka:
// mikä pöytä sopii tietylle henkilömäärälle ja onko se jo varattu kyseiselle ajalle
@Service
public class TableService {

    private final TableListRepository tableListRepository;
    private final ReservationRepository reservationRepository;

    public TableService(
            TableListRepository tableListRepository,
            ReservationRepository reservationRepository
    ) {
        this.tableListRepository = tableListRepository;
        this.reservationRepository = reservationRepository;
    }

    // Riittääkö pöydän kapasiteetti annetulle henkilömäärälle?
    public boolean hasCapacityFor(Table table, int partySize) {
        return table.getCapacity() >= partySize;
    }

    // Onko pöytä vapaana annettuna päivänä ja kellonaikana, eli ei päällekkäistä varausta
    public boolean isAvailable(
            Integer tableId,
            LocalDateTime datetime,
            LocalTime startTime,
            LocalTime endTime
    ) {
        List<TableList> assignments = tableListRepository.findByIdTableId(tableId);

        for (TableList assignment : assignments) {
            Integer reservationId = assignment.getId().getReservationId();

            Reservation reservation = reservationRepository.findById(reservationId).orElse(null);

            if (reservation != null
                    && (reservation.getStatus() == null
                        || !"CANCELLED".equals(reservation.getStatus().getName()))
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
