package com.pants.backend.service;

import java.security.SecureRandom; 
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; 

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.entity.Customer;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.CustomerRepository;
import com.pants.backend.repository.RStatusRepository;
import com.pants.backend.repository.ReservationRepository;

@Service
public class ReservationService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;
    private final RStatusRepository rStatusRepository;

    public ReservationService(
        ReservationRepository reservationRepository,
        CustomerRepository customerRepository,
        RStatusRepository rStatusRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.customerRepository = customerRepository;
        this.rStatusRepository = rStatusRepository;
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
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

        Customer customer = findOrCreateCustomer(dto.getCustomer()); // jos sähköposti on jo tietokannassa, käyttää samaa asiakasta, jolloin duplikaatteja ei synny.

        Reservation reservation = new Reservation();
        applyDto(reservation, dto);
        reservation.setCustomer(customer);
        reservation.setStatus(
            rStatusRepository
                .findByName("CONFIRMED")
                .orElseThrow(() -> new IllegalStateException("Status CONFIRMED missing"))
        );
        reservation.setEditToken(generateToken()); // TOKEN

        return reservationRepository.save(reservation);
    }

    @Transactional 
public Reservation updateReservation(Integer id, ReservationDTO dto) {
        Reservation existingReservation = reservationRepository
            .findById(id)
            .orElseThrow(() -> new NoSuchElementException("Reservation not found"));

        return applyUpdate(existingReservation, dto);
    }

     // TOKEN
    @Transactional // varmistaa, että asiakkaan ja varauksen tallennus onnistuvat yhdessä tai epäonnistuvat yhdessä.
    public Reservation updateReservationByToken(String token, ReservationDTO dto) {
        Reservation existingReservation = getReservationByToken(token);

        if (existingReservation.getDatetime().isBefore(LocalDateTime.now().plusHours(1))) {
            throw new IllegalStateException("Reservation can no longer be modified");
        }

        return applyUpdate(existingReservation, dto);
    }

    public boolean deleteReservation(Integer id) {

        if (!reservationRepository.existsById(id)) {
            return false;
        }

        reservationRepository.deleteById(id);

        return true;
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
