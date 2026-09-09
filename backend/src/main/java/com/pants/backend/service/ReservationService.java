package com.pants.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.entity.Customer;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.CustomerRepository;
import com.pants.backend.repository.ReservationRepository;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final CustomerRepository customerRepository;

    public ReservationService(
        ReservationRepository reservationRepository,
        CustomerRepository customerRepository
    ) {
        this.reservationRepository = reservationRepository;
        this.customerRepository = customerRepository;
    }

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    public Reservation getReservationById(Integer id) {
        return reservationRepository.findById(id).orElse(null);
    }

    public Reservation createReservation(ReservationDTO reservationDTO) {
        Reservation reservation = new Reservation();

        reservation.setStartTime(reservationDTO.getStartTime());
        reservation.setEndTime(reservationDTO.getEndTime());
        reservation.setPartySize(reservationDTO.getPartySize());
        reservation.setDetails(reservationDTO.getDetails());

        Customer customer = new Customer();

        customer.setFirstname(reservationDTO.getCustomer().getFirstname());
        customer.setLastname(reservationDTO.getCustomer().getLastname());
        customer.setEmail(reservationDTO.getCustomer().getEmail());

        Customer savedCustomer = customerRepository.save(customer);

        reservation.setCustomer(savedCustomer);

        return reservationRepository.save(reservation);
    }

    public Reservation updateReservation(Integer id, Reservation reservation) {
        Reservation existingReservation = reservationRepository.findById(id).orElse(null);

        if (existingReservation == null) {
            return null;
        }

        existingReservation.setCustomer(reservation.getCustomer());
        existingReservation.setStartTime(reservation.getStartTime());
        existingReservation.setEndTime(reservation.getEndTime());
        existingReservation.setDatetime(reservation.getDatetime());
        existingReservation.setPartySize(reservation.getPartySize());
        existingReservation.setDetails(reservation.getDetails());

        return reservationRepository.save(existingReservation);
    }

    public boolean deleteReservation(Integer id) {
        if (!reservationRepository.existsById(id)) {
            return false;
        }

        reservationRepository.deleteById(id);

        return true;
    }
}