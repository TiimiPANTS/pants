package com.pants.backend.service;

import java.security.SecureRandom; 
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; 

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ReservationAvailabilityDTO;
import com.pants.backend.dto.ReservationDTO;
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
    private static final int MAX_GUESTS_PER_SLOT = 10;

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;
    private final RStatusRepository rStatusRepository;
    private final TableService tableService;
    private final TableListRepository tableListRepository;

    public ReservationService(
        ReservationRepository reservationRepository,
        CustomerRepository customerRepository,
        RStatusRepository rStatusRepository,
        TableService tableService,
        TableListRepository tableListRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.customerRepository = customerRepository;
        this.rStatusRepository = rStatusRepository;
        this.tableService = tableService;
        this.tableListRepository = tableListRepository;
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

    // Token
    public Reservation getReservationByToken(String token) {
        return reservationRepository
            .findByEditToken(token)
            .orElseThrow(() -> new NoSuchElementException("Reservation not found"));
    }

    @Transactional // varmistaa, että asiakkaan ja varauksen tallennus onnistuvat yhdessä tai epäonnistuvat yhdessä.
    public Reservation createReservation(ReservationDTO dto) {
        validate(dto);
        RStatus confirmedStatus = lockConfirmedReservations();
        ensureSlotHasCapacity(dto, null);
        Table selectedTable = findAvailableTable(dto, null);
        Customer customer = findOrCreateCustomer(dto.getCustomer()); // jos sähköposti on jo tietokannassa, käyttää samaa asiakasta, jolloin duplikaatteja ei synny.

        Reservation reservation = new Reservation();
        applyDto(reservation, dto);
        reservation.setCustomer(customer);
        reservation.setStatus(confirmedStatus);
        reservation.setEditToken(generateToken()); // TOKEN
        Reservation savedReservation = reservationRepository.save(reservation);
        tableListRepository.save(new TableList(savedReservation.getReservationId(), selectedTable.getId()));
        return savedReservation;
    }

    @Transactional 
public Reservation updateReservation(Integer id, ReservationDTO dto) {
        Reservation existingReservation = reservationRepository
            .findById(id)
            .orElseThrow(() -> new NoSuchElementException("Reservation not found"));

        validate(dto);
        lockConfirmedReservations();
        ensureSlotHasCapacity(dto, existingReservation.getReservationId());
        Table selectedTable = findAvailableTable(dto, existingReservation.getReservationId());
        Reservation updatedReservation = applyUpdate(existingReservation, dto);
        updateTableAssignment(updatedReservation, selectedTable);
        return updatedReservation;
    }

     // TOKEN
    @Transactional // varmistaa, että asiakkaan ja varauksen tallennus onnistuvat yhdessä tai epäonnistuvat yhdessä.
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
        Table selectedTable = findAvailableTable(dto, existingReservation.getReservationId());
        Reservation updatedReservation = applyUpdate(existingReservation, dto);
        updateTableAssignment(updatedReservation, selectedTable);
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
// TOKEN
    @Transactional
    public Reservation cancelReservationByToken(String token) {
        Reservation reservation = getReservationByToken(token);

        if (reservation.getDatetime().isBefore(LocalDateTime.now().plusHours(1))) {
            throw new IllegalStateException("Reservation can no longer be cancelled");
        }

        return applyCancel(reservation);
    }

    // OWNER / ADMIN
    @Transactional
    public Reservation cancelReservation(Integer id) {
        Reservation reservation = reservationRepository
            .findById(id)
            .orElseThrow(() -> new NoSuchElementException("Reservation not found"));

        return applyCancel(reservation);
    }

    private Reservation applyCancel(Reservation reservation) {
        if ("CANCELLED".equals(reservation.getStatus().getName())) {
            throw new IllegalStateException("Reservation is already cancelled");
        }

        reservation.setStatus(
            rStatusRepository
                .findByName("CANCELLED")
                .orElseThrow(() -> new IllegalStateException("Status CANCELLED missing"))
        );

        return reservationRepository.save(reservation);
    }

    private Table findAvailableTable(ReservationDTO dto, Integer ignoreReservationId) {
        List<Table> availableTables = ignoreReservationId == null
            ? tableService.findAvailableTables(
                dto.getPartySize(), dto.getDatetime(), dto.getStartTime(), dto.getEndTime())
            : tableService.findAvailableTables(
                dto.getPartySize(), dto.getDatetime(), dto.getStartTime(), dto.getEndTime(), ignoreReservationId);
        if (availableTables.isEmpty()) {
            throw new IllegalStateException("No suitable tables available for this reservation");
        }
        return availableTables.getFirst();
    }

    private void updateTableAssignment(Reservation reservation, Table selectedTable) {
        boolean alreadyAssigned = false;
        for (TableList assignment : tableListRepository.findByIdReservationId(reservation.getReservationId())) {
            if (selectedTable.getId().equals(assignment.getId().getTableId())) {
                alreadyAssigned = true;
            } else {
                tableListRepository.delete(assignment);
            }
        }
        if (!alreadyAssigned) {
            tableListRepository.save(new TableList(reservation.getReservationId(), selectedTable.getId()));
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
        if (dto.getPartySize() > 10) {
            throw new IllegalArgumentException("A reservation cannot exceed 10 guests");
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

    // TOKEN
    private String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
