package com.pants.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pants.backend.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Integer> {
     Optional<Customer> findByEmailIgnoreCase(String email);
}
