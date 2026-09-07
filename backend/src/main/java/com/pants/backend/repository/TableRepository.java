package com.pants.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.Table;

public interface TableRepository extends JpaRepository<Table, Integer> {

    List<RestaurantTable> findByCapacityGreaterThanEqual(int capacity);

}