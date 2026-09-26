package com.pants.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.Reservation;

public interface ReservationRepository extends JpaRepository<Reservation, Integer>{
    Optional<Reservation> findByEditToken(String editToken);
}
