
package com.pants.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import com.pants.backend.entity.Reservation;

public interface ReservationRepository extends JpaRepository<Reservation, Integer> {

    Optional<Reservation> findByEditToken(String editToken);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Reservation r WHERE r.editToken = :editToken")
    Optional<Reservation> findByEditTokenForUpdate(
            @Param("editToken") String editToken
    );

    List<Reservation> findByDatetimeGreaterThanEqualAndDatetimeLessThan(
            LocalDateTime from,
            LocalDateTime to
    );
}
