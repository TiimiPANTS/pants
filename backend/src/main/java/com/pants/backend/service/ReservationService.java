package com.pants.backend.service;

import java.security.SecureRandom; 
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.Base64;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; 

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ReservationAvailabilityDTO;
import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.dto.ReservationStatsDTO;
import com.pants.backend.entity.Customer;
import com.pants.backend.entity.RStatus;
import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.Table;
import com.pants.backend.entity.TableList;
import com.pants.backend.repository.CustomerRepository;
import com.pants.backend.repository.RStatusRepository;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;

@Service
public class ReservationService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_GUESTS_PER_SLOT = 50;
    private static final int CANCELLED_STATUS_ID = 3;

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;
    private final RStatusRepository rStatusRepository;
    private final TableService tableService;
    private final TableListRepository tableListRepository;
    private final CancelService cancelService;

    public ReservationService(
        ReservationRepository reservationRepository,
        CustomerRepository customerRepository,
        RStatusRepository rStatusRepository,
        TableService tableService,
        TableListRepository tableListRepository,
        CancelService cancelService
    ) {
        this.reservationRepository = reservationRepository;
        this.customerRepository = customerRepository;
        this.rStatusRepository = rStatusRepository;
        this.tableService = tableService;
        this.tableListRepository = tableListRepository;
        this.cancelService = cancelService;
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ReservationAvailabilityDTO> getReservationAvailability(
        LocalDate from,
        LocalDate to
    ) {
        List<ReservationAvailabilityDTO> availability = new java.util.ArrayList<>();
        long dayCount = ChronoUnit.DAYS.between(from, to);
        List<Reservation> existingReservations =
            reservationRepository.findByDatetimeGreaterThanEqualAndDatetimeLessThan(
                from.atStartOfDay(),
                to.plusDays(1).atStartOfDay()
            );

        for (int offset = 0; offset <= dayCount; offset++) {
            LocalDate date = from.plusDays(offset);
            for (LocalTime startTime : getReservationTimes(date)) {
                availability.add(new ReservationAvailabilityDTO(
                    date,
                    startTime,
                    getRemainingCapacity(date, startTime, existingReservations, null)
                ));
            }
        }

        return availability;
    }

    public ReservationStatsDTO getWeeklyStats(LocalDate anyDayOfWeek) {
    LocalDate monday = anyDayOfWeek.with(
        TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    LocalDate nextMonday = monday.plusDays(7);

    List<Reservation> reservations = reservationRepository
        .findByDatetimeGreaterThanEqualAndDatetimeLessThan(
            monday.atStartOfDay(),
            nextMonday.atStartOfDay())
        .stream()
        .filter(r -> r.getStatus() == null
            || !Integer.valueOf(CANCELLED_STATUS_ID).equals(r.getStatus().getId()))
        .toList();

    Map<String, Long> byDay = new LinkedHashMap<>();
    for (DayOfWeek day : DayOfWeek.values()) {
        byDay.put(day.name(), 0L);
    }

    Map<String, Long> byTime = new TreeMap<>();

    for (Reservation r : reservations) {
        byDay.merge(r.getDatetime().getDayOfWeek().name(), 1L, Long::sum);
        if (r.getStartTime() != null) {
            byTime.merge(r.getStartTime().toString(), 1L, Long::sum);
        }
    }

    String busiestDay = reservations.isEmpty() ? null : findMaxKey(byDay);
    String busiestTime = byTime.isEmpty() ? null : findMaxKey(byTime);

    return new ReservationStatsDTO(
        monday,
        nextMonday.minusDays(1),
        reservations.size(),
        busiestDay,
        busiestTime,
        byDay,
        byTime
    );
}

private String findMaxKey(Map<String, Long> map) {
    return map.entrySet().stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey)
        .orElse(null);
}

    private List<LocalTime> getReservationTimes(LocalDate date) {
        if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
            return List.of();
        }

        int openingHour = date.getDayOfWeek() == DayOfWeek.SATURDAY ? 11 : 10;
        List<LocalTime> times = new java.util.ArrayList<>();
        for (int hour = openingHour; hour <= 17; hour++) {
            times.add(LocalTime.of(hour, 0));
            if (hour < 17) {
                times.add(LocalTime.of(hour, 30));
            }
        }
        return times;
    }

    private int getRemainingCapacity(
        LocalDate date,
        LocalTime startTime,
        List<Reservation> existingReservations,
        Integer ignoreReservationId
    ) {
        int usedCapacity = existingReservations.stream()
            .filter(reservation -> reservation.getDatetime() != null
                && reservation.getDatetime().toLocalDate().equals(date))
            .filter(reservation -> startTime.equals(reservation.getStartTime()))
            .filter(reservation -> reservation.getStatus() == null
                || !"CANCELLED".equals(reservation.getStatus().getName()))
            .filter(reservation -> ignoreReservationId == null
                || !ignoreReservationId.equals(reservation.getReservationId()))
            .mapToInt(Reservation::getPartySize)
            .sum();

        return Math.max(0, MAX_GUESTS_PER_SLOT - usedCapacity);
    }

    private RStatus lockConfirmedReservations() {
        return rStatusRepository
            .findByNameForUpdate("CONFIRMED")
            .orElseThrow(() -> new IllegalStateException("Status CONFIRMED missing"));
    }

    private void ensureSlotHasCapacity(ReservationDTO dto, Integer ignoreReservationId) {
        LocalDate date = dto.getDatetime().toLocalDate();
        LocalTime startTime = dto.getStartTime();
        List<Reservation> existingReservations =
            reservationRepository.findByDatetimeGreaterThanEqualAndDatetimeLessThan(
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay()
            );

        int remainingCapacity = getRemainingCapacity(
            date,
            startTime,
            existingReservations,
            ignoreReservationId
        );
        if (dto.getPartySize() > remainingCapacity) {
            throw new IllegalStateException("Not enough capacity for this reservation slot");
        }
    }

    public Reservation getReservationById(Integer id) {
        return reservationRepository.findById(id).orElse(null);
    }

    public Reservation getReservationByToken(String token) {
        return reservationRepository
            .findByEditToken(token)
            .orElseThrow(() -> new NoSuchElementException("Reservation not found"));
    }

    @Transactional
    public Reservation createReservation(ReservationDTO dto) {
        validate(dto);
        RStatus confirmedStatus = lockConfirmedReservations();
        ensureSlotHasCapacity(dto, null);
        List<Table> selectedTables = findAvailableTables(dto, null);
        Customer customer = findOrCreateCustomer(dto.getCustomer());

        Reservation reservation = new Reservation();
        applyDto(reservation, dto);
        reservation.setCustomer(customer);
        reservation.setStatus(confirmedStatus);
        reservation.setEditToken(generateToken());
        Reservation savedReservation = reservationRepository.save(reservation);
        for (Table selectedTable : selectedTables) {
            tableListRepository.save(new TableList(savedReservation.getReservationId(), selectedTable.getId()));
        }
        return savedReservation;
    }

    @Transactional 
public Reservation updateReservation(Integer id, ReservationDTO dto) {
        Reservation existingReservation = reservationRepository
            .findById(id)
            .orElseThrow(() -> new NoSuchElementException("Reservation not found"));

            if ("CANCELLED".equals(existingReservation.getStatus().getName())) {
                throw new IllegalStateException("Cancelled reservations cannot be modified");
        }

        validate(dto);
        lockConfirmedReservations();
        ensureSlotHasCapacity(dto, existingReservation.getReservationId());
        List<Table> selectedTables = findAvailableTables(dto, existingReservation.getReservationId());
        Reservation updatedReservation = applyUpdate(existingReservation, dto);
        updateTableAssignment(updatedReservation, selectedTables);
        return updatedReservation;
    }

    @Transactional
    public Reservation updateReservationByToken(String token, ReservationDTO dto) {
        Reservation existingReservation = getReservationByToken(token);

            if ("CANCELLED".equals(existingReservation.getStatus().getName())) {
        throw new IllegalStateException("Cancelled reservations cannot be modified");
        }
        if (existingReservation.getDatetime().isBefore(LocalDateTime.now().plusHours(1))) {
            throw new IllegalStateException("Reservation can no longer be modified");
        }

        validate(dto);
        lockConfirmedReservations();
        ensureSlotHasCapacity(dto, existingReservation.getReservationId());
        List<Table> selectedTables = findAvailableTables(dto, existingReservation.getReservationId());
        Reservation updatedReservation = applyUpdate(existingReservation, dto);
        updateTableAssignment(updatedReservation, selectedTables);
        return updatedReservation;
    }

    @Transactional
    public boolean deleteReservation(Integer id) {

        if (!reservationRepository.existsById(id)) {
            return false;
        }

        tableListRepository.deleteAll(tableListRepository.findByIdReservationId(id));
        reservationRepository.deleteById(id);

        return true;
    }
    @Transactional
    public Reservation cancelReservationByToken(String token) {
        Reservation reservation = getReservationByToken(token);

        if (reservation.getDatetime().isBefore(LocalDateTime.now().plusHours(1))) {
            throw new IllegalStateException("Reservation can no longer be cancelled");
        }

        return applyCancel(reservation);
    }

    @Transactional
    public Reservation cancelReservation(Integer id) {
        Reservation reservation = reservationRepository
            .findById(id)
            .orElseThrow(() -> new NoSuchElementException("Reservation not found"));

        return applyCancel(reservation);
    }

    private Reservation applyCancel(Reservation reservation) {
        if (reservation.getStatus() != null
                && Integer.valueOf(CANCELLED_STATUS_ID).equals(reservation.getStatus().getId())) {
            throw new IllegalStateException("Reservation is already cancelled");
        }

        reservation.setStatus(
            rStatusRepository
                .findById(CANCELLED_STATUS_ID)
                .orElseThrow(() -> new IllegalStateException(
                    "Status with ID " + CANCELLED_STATUS_ID + " missing"))
        );

        Reservation savedReservation = reservationRepository.save(reservation);
        if (savedReservation.getStatus() != null
                && Integer.valueOf(CANCELLED_STATUS_ID).equals(savedReservation.getStatus().getId())) {
            cancelService.sendCancellationEmail(savedReservation);
        }
        return savedReservation;
    }

    private List<Table> findAvailableTables(ReservationDTO dto, Integer ignoreReservationId) {
        List<Table> singleTables = ignoreReservationId == null
            ? tableService.findAvailableTables(
                dto.getPartySize(), dto.getDatetime(), dto.getStartTime(), dto.getEndTime())
            : tableService.findAvailableTables(
                dto.getPartySize(), dto.getDatetime(), dto.getStartTime(), dto.getEndTime(), ignoreReservationId);
        if (!singleTables.isEmpty()) {
            return List.of(singleTables.getFirst());
        }

        List<Table> combination = tableService.findTableCombination(
            dto.getPartySize(), dto.getDatetime(), dto.getStartTime(), dto.getEndTime(), ignoreReservationId);
        if (combination.isEmpty()) {
            throw new IllegalStateException("No suitable tables available for this reservation");
        }
        return combination;
    }

    private void updateTableAssignment(Reservation reservation, List<Table> selectedTables) {
        Set<Integer> selectedIds = selectedTables.stream().map(Table::getId).collect(Collectors.toSet());
        Set<Integer> assignedIds = new HashSet<>();
        for (TableList assignment : tableListRepository.findByIdReservationId(reservation.getReservationId())) {
            Integer tableId = assignment.getId().getTableId();
            if (selectedIds.contains(tableId)) {
                assignedIds.add(tableId);
            } else {
                tableListRepository.delete(assignment);
            }
        }
        for (Integer tableId : selectedIds) {
            if (!assignedIds.contains(tableId)) {
                tableListRepository.save(new TableList(reservation.getReservationId(), tableId));
            }
        }
    }


    private Reservation applyUpdate(Reservation reservation, ReservationDTO dto) {
        validate(dto);

        Customer customer = reservation.getCustomer();
        customer.setFirstname(dto.getCustomer().getFirstname());
        customer.setLastname(dto.getCustomer().getLastname());
        customer.setEmail(dto.getCustomer().getEmail());
        customerRepository.save(customer);

        applyDto(reservation, dto);

        return reservationRepository.save(reservation);
    }

    private Customer findOrCreateCustomer(CustomerDTO customerDTO) {
        Customer customer = customerRepository
            .findByEmailIgnoreCase(customerDTO.getEmail())
            .orElseGet(Customer::new);

        customer.setFirstname(customerDTO.getFirstname());
        customer.setLastname(customerDTO.getLastname());
        customer.setEmail(customerDTO.getEmail());

        return customerRepository.save(customer);
    }

    private void validate(ReservationDTO dto) {
        if (dto.getCustomer() == null || isBlank(dto.getCustomer().getEmail())) {
            throw new IllegalArgumentException("Customer email is required");
        }
        if (isBlank(dto.getCustomer().getFirstname()) || isBlank(dto.getCustomer().getLastname())) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (dto.getDatetime() == null || dto.getStartTime() == null) {
            throw new IllegalArgumentException("Date and time are required");
        }
        if (dto.getPartySize() == null || dto.getPartySize() < 1) {
            throw new IllegalArgumentException("Party size must be at least 1");
        }
        if (dto.getPartySize() > ReservationDTO.MAX_PARTY_SIZE) {
            throw new IllegalArgumentException(
                "A reservation cannot exceed " + ReservationDTO.MAX_PARTY_SIZE + " guests");
        }
    }

    private void applyDto(Reservation reservation, ReservationDTO dto) {
        reservation.setDatetime(dto.getDatetime());
        reservation.setStartTime(dto.getStartTime());
        reservation.setEndTime(dto.getEndTime());
        reservation.setPartySize(dto.getPartySize());
        reservation.setDetails(dto.getDetails());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
