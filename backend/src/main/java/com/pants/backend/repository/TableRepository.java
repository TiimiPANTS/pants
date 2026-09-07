package com.pants.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.Table;

public interface TableRepository extends JpaRepository<Table, Integer> {

}