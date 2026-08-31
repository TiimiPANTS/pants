package com.pants.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.entity.Customer;
import com.pants.backend.repository.CustomerRepository;

// REST-controller asiakkaille, kuuntelee osoitetta /customers
@RestController
@RequestMapping("/customers")
public class CustomerController {

    // Spring injektoi repositoryn konstruktorin kautta, jotta tietokantaa voi käyttää
    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    // GET /customers -> palauttaa kaikki asiakkaat tietokannasta
    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    // GET /customers/{id} -> hakee yhden asiakkaan id:llä, null jos ei löydy
    @GetMapping("/{id}")
    public Customer getCustomerById(@PathVariable Long id) {
        return customerRepository.findById(id).orElse(null);
    }

    // POST /customers -> luo uuden asiakkaan pyynnön body:sta ja tallentaa sen
    @PostMapping
    public Customer createCustomer(@RequestBody Customer customer) {
        return customerRepository.save(customer);
    }
}
