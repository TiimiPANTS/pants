package com.pants.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.RestaurantTable;

public interface TableRepository extends JpaRepository<RestaurantTable, Long>  {

}