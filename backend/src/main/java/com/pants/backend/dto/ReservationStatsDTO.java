package com.pants.backend.dto;

import java.time.LocalDate;
import java.util.Map;

public class ReservationStatsDTO {

    private final LocalDate weekStart;
    private final LocalDate weekEnd;
    private final long totalReservations;
    private final String busiestDay;          // esim. "FRIDAY", null jos ei varauksia
    private final String busiestTime;         // esim. "18:00", null jos ei varauksia
    private final Map<String, Long> reservationsByDay;   // MONDAY..SUNDAY
    private final Map<String, Long> reservationsByTime;  // "17:00" -> 3

    public ReservationStatsDTO(
        LocalDate weekStart,
        LocalDate weekEnd,
        long totalReservations,
        String busiestDay,
        String busiestTime,
        Map<String, Long> reservationsByDay,
        Map<String, Long> reservationsByTime
    ) {
        this.weekStart = weekStart;
        this.weekEnd = weekEnd;
        this.totalReservations = totalReservations;
        this.busiestDay = busiestDay;
        this.busiestTime = busiestTime;
        this.reservationsByDay = reservationsByDay;
        this.reservationsByTime = reservationsByTime;
    }

    public LocalDate getWeekStart() { return weekStart; }
    public LocalDate getWeekEnd() { return weekEnd; }
    public long getTotalReservations() { return totalReservations; }
    public String getBusiestDay() { return busiestDay; }
    public String getBusiestTime() { return busiestTime; }
    public Map<String, Long> getReservationsByDay() { return reservationsByDay; }
    public Map<String, Long> getReservationsByTime() { return reservationsByTime; }
}

