
package com.pants.backend.controller;

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.entity.Customer;
import com.pants.backend.repository.CustomerRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Optional;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerValidationTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerController customerController;

    private CustomerDTO validCustomer;

    @BeforeEach
    void setUp() {
        validCustomer = new CustomerDTO(
                null, "Matti", "Virtanen", "matti@example.com"
        );
    }

    private static Stream<Arguments> invalidFirstnames() {
        return Stream.of(
                Arguments.of("M", "too short"),
                Arguments.of("M".repeat(51), "too long"),
                Arguments.of("Matti123", "numbers"),
                Arguments.of("Matti!", "special character")
        );
    }

    @ParameterizedTest
    @MethodSource("invalidFirstnames")
    void create_rejectsInvalidFirstname(String firstname, String reason) {
        validCustomer.setFirstname(firstname);

        ResponseEntity<?> response =
                customerController.createCustomer(validCustomer);

        assertThat(response.getStatusCode())
                .as(reason)
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(customerRepository, never()).save(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"Matti-Pekka", "Äänekoski", "Ma"})
    void create_acceptsValidFirstname(String firstname) {
        validCustomer.setFirstname(firstname);

        when(customerRepository.save(any(Customer.class)))
                .thenAnswer(invocation -> {
                    Customer customer = invocation.getArgument(0);
                    customer.setId(1);
                    return customer;
                });

        ResponseEntity<?> response =
                customerController.createCustomer(validCustomer);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        verify(customerRepository).save(any(Customer.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"V", "Virtanen123", "Virtanen!"})
    void create_rejectsInvalidLastname(String lastname) {
        validCustomer.setLastname(lastname);

        ResponseEntity<?> response =
                customerController.createCustomer(validCustomer);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(customerRepository, never()).save(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"testi@", "testi", "testi@example"})
    void create_rejectsInvalidEmail(String email) {
        validCustomer.setEmail(email);

        ResponseEntity<?> response =
                customerController.createCustomer(validCustomer);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(customerRepository, never()).save(any());
    }

    @Test
    void create_rejectsTooLongEmail() {
        validCustomer.setEmail("a".repeat(250) + "@example.com");

        ResponseEntity<?> response =
                customerController.createCustomer(validCustomer);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(customerRepository, never()).save(any());
    }

    @Test
    void create_acceptsValidEmail() {
        when(customerRepository.save(any(Customer.class)))
                .thenAnswer(invocation -> {
                    Customer customer = invocation.getArgument(0);
                    customer.setId(1);
                    return customer;
                });

        ResponseEntity<?> response =
                customerController.createCustomer(validCustomer);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    void update_rejectsInvalidFirstname() {
        Customer existing = new Customer();
        existing.setId(1);
        existing.setFirstname("Matti");
        existing.setLastname("Virtanen");
        existing.setEmail("matti@example.com");

        when(customerRepository.findById(1))
                .thenReturn(Optional.of(existing));

        validCustomer.setFirstname("Matti123");

        ResponseEntity<?> response =
                customerController.updateCustomer(1, validCustomer);

        assertThat(response.getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        verify(customerRepository, never()).save(any());

        assertThat(existing.getFirstname()).isEqualTo("Matti");
    }
}
