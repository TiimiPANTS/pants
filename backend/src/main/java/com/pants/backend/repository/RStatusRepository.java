package com.pants.backend.repository;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pants.backend.entity.RStatus;

public interface RStatusRepository extends JpaRepository<RStatus, Integer> {
    Optional<RStatus> findByName(String name);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from RStatus s where s.name = :name")
    Optional<RStatus> findByNameForUpdate(@Param("name") String name);
}