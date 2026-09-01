package com.pants.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.Reservation;

public interface ReservationRepository extends JpaRepository<Reservation, Long>{

}
