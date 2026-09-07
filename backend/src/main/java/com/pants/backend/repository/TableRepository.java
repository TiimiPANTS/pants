package com.pants.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.RestaurantTable;

public interface TableRepository extends JpaRepository<RestaurantTable, Long>  {

    List<RestaurantTable> findByCapacityGreaterThanEqual(int capacity);

}