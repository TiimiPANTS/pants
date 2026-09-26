package com.pants.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.RStatus;

public interface RStatusRepository extends JpaRepository<RStatus, Integer> {
    Optional<RStatus> findByName(String name);
}