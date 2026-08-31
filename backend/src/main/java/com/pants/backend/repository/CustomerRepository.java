package com.pants.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
}
