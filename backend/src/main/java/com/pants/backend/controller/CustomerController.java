package com.pants.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.entity.Customer;
import com.pants.backend.repository.CustomerRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/customers")
@Tag(name = "Customer API", description = "Endpoints for managing customers")
public class CustomerController {

    // Spring injektoi repositoryn konstruktorin kautta, jotta tietokantaa voi käyttää
    private final CustomerRepository customerRepository;

    public CustomerController(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @Operation(summary = "Get all customers", description = "Returns a list of all customers")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All customers found successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = CustomerDTO.class))
            ),
            @ApiResponse(responseCode = "404", description = "No customers found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping
    public ResponseEntity<?> getAllCustomers() {
        List<Customer> customers = customerRepository.findAll();

        if (customers.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "No customers found"));
        }

        List<CustomerDTO> customerDTOs = customers.stream()
                .map(this::toDto)
                .toList();

        return ResponseEntity.ok(customerDTOs);
    }

    @Operation(summary = "Get customer by ID", description = "Returns a single customer by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Customer found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = CustomerDTO.class))
            ),
            @ApiResponse(responseCode = "404", description = "Customer not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomerById(@PathVariable Integer id) {
        return customerRepository.findById(id)
                .map(customer -> ResponseEntity.ok((Object) toDto(customer)))
                .orElseGet(() -> ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(new ErrorResponse(404, "Customer not found"))
                );
    }

    @Operation(summary = "Create a new customer", description = "Adds a new customer to the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Customer created successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = CustomerDTO.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid customer data",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody CustomerDTO customerDTO) {
        try {
            ResponseEntity<?> validation = validateCustomer(customerDTO);

            if (validation != null) {
                return validation;
            }

            Customer customer = new Customer();
            customer.setFirstname(customerDTO.getFirstname());
            customer.setLastname(customerDTO.getLastname());
            customer.setEmail(customerDTO.getEmail());

            Customer savedCustomer = customerRepository.save(customer);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(toDto(savedCustomer));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(
                            400,
                            "Invalid customer data: " + e.getMessage()
                    ));
        }
    }

    @Operation(summary = "Update an existing customer", description = "Updates information for an existing customer")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Customer updated successfully",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = CustomerDTO.class))
            ),
            @ApiResponse(responseCode = "400", description = "Invalid customer data",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(responseCode = "404", description = "Customer not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCustomer(
            @PathVariable Integer id,
            @RequestBody CustomerDTO customerDTO
    ) {
        Customer existingCustomer = customerRepository.findById(id).orElse(null);

        if (existingCustomer == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "Customer not found"));
        }

        ResponseEntity<?> validation = validateCustomer(customerDTO);

        if (validation != null) {
            return validation;
        }

        existingCustomer.setFirstname(customerDTO.getFirstname());
        existingCustomer.setLastname(customerDTO.getLastname());
        existingCustomer.setEmail(customerDTO.getEmail());

        Customer updatedCustomer = customerRepository.save(existingCustomer);

        return ResponseEntity.ok(toDto(updatedCustomer));
    }

    @Operation(summary = "Delete customer by ID", description = "Deletes a single customer by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Customer deleted successfully",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(type = "object", example = "{\"message\": \"Successfully deleted customer with id 1\"}"))
            ),
            @ApiResponse(responseCode = "404", description = "Customer not found",
                    content = @Content(mediaType = "application/json", schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCustomerById(@PathVariable Integer id) {
        if (customerRepository.existsById(id)) {
            customerRepository.deleteById(id);

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Successfully deleted customer with id " + id
                    )
            );
        }

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(404, "Customer not found"));
    }

    // Customer data validation

    private ResponseEntity<?> validateCustomer(CustomerDTO customerDTO) {
        if (customerDTO.getFirstname() == null || customerDTO.getFirstname().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "Firstname is required"));
        }

        if (customerDTO.getLastname() == null || customerDTO.getLastname().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "Lastname is required"));
        }

        if (customerDTO.getEmail() == null || customerDTO.getEmail().isBlank()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "Email is required"));
        }

        return null;
    }

    private CustomerDTO toDto(Customer customer) {
        return new CustomerDTO(
                customer.getId(),
                customer.getFirstname(),
                customer.getLastname(),
                customer.getEmail()
        );
    }
}
