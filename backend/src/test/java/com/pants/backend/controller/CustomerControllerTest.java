package com.pants.backend.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.pants.backend.dto.CustomerDTO;
import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.entity.Customer;
import com.pants.backend.repository.CustomerRepository;

@ExtendWith(MockitoExtension.class)
class CustomerControllerTest {

    @Mock
    private CustomerRepository customerRepository;

    @InjectMocks
    private CustomerController customerController;


    private static Customer createCustomer(Integer id, String firstname, String lastname, String email) {
        Customer customer = new Customer();
        customer.setId(id);
        customer.setFirstname(firstname);
        customer.setLastname(lastname);
        customer.setEmail(email);
        return customer;
    }

    private static Customer createCustomer() {
        return createCustomer(1, "Testi", "Kayttaja", "testi@mail.fi");
    }

    private static CustomerDTO validDto() {
        return new CustomerDTO(null, "Testi", "Kayttaja", "testi@mail.fi");
    }

    private static void assertError(ResponseEntity<?> response, HttpStatus status, String message) {
        assertThat(response.getStatusCode()).isEqualTo(status);
        assertThat(response.getBody()).isInstanceOf(ErrorResponse.class);

        ErrorResponse error = (ErrorResponse) response.getBody();
        assertThat(error.getStatus()).isEqualTo(status.value());
        assertThat(error.getMessage()).isEqualTo(message);
    }

    static Stream<Arguments> invalidCustomers() {
        return Stream.of(
                Arguments.of(new CustomerDTO(null, null, "Kayttaja", "testi@mail.fi"), "Firstname is required"),
                Arguments.of(new CustomerDTO(null, "", "Kayttaja", "testi@mail.fi"), "Firstname is required"),
                Arguments.of(new CustomerDTO(null, "   ", "Kayttaja", "testi@mail.fi"), "Firstname is required"),
                Arguments.of(new CustomerDTO(null, "Testi", null, "testi@mail.fi"), "Lastname is required"),
                Arguments.of(new CustomerDTO(null, "Testi", "", "testi@mail.fi"), "Lastname is required"),
                Arguments.of(new CustomerDTO(null, "Testi", "   ", "testi@mail.fi"), "Lastname is required"),
                Arguments.of(new CustomerDTO(null, "Testi", "Kayttaja", null), "Email is required"),
                Arguments.of(new CustomerDTO(null, "Testi", "Kayttaja", ""), "Email is required"),
                Arguments.of(new CustomerDTO(null, "Testi", "Kayttaja", "   "), "Email is required")
        );
    }

    // GET /api/customers

    @Test
    void getAll_whenCustomersExist_returnsOk() {
        Customer first = createCustomer();
        Customer second = createCustomer(2, "Toinen", "Asiakas", "toinen@mail.fi");

        when(customerRepository.findAll()).thenReturn(List.of(first, second));

        ResponseEntity<?> response = customerController.getAllCustomers();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        @SuppressWarnings("unchecked")
        List<CustomerDTO> body = (List<CustomerDTO>) response.getBody();

        assertThat(body).hasSize(2);
        assertThat(body.get(0).getId()).isEqualTo(1);
        assertThat(body.get(0).getFirstname()).isEqualTo("Testi");
        assertThat(body.get(0).getLastname()).isEqualTo("Kayttaja");
        assertThat(body.get(0).getEmail()).isEqualTo("testi@mail.fi");
        assertThat(body.get(1).getId()).isEqualTo(2);
    }

    @Test
    void getAll_whenNoCustomers_returnsNotFound() {
        when(customerRepository.findAll()).thenReturn(Collections.emptyList());

        ResponseEntity<?> response = customerController.getAllCustomers();

        assertError(response, HttpStatus.NOT_FOUND, "No customers found");
    }

    // GET /api/customers/{id}

    @Test
    void getById_whenExists_returnsOk() {
        when(customerRepository.findById(1)).thenReturn(Optional.of(createCustomer()));

        ResponseEntity<?> response = customerController.getCustomerById(1);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        CustomerDTO body = (CustomerDTO) response.getBody();
        assertThat(body.getId()).isEqualTo(1);
        assertThat(body.getFirstname()).isEqualTo("Testi");
        assertThat(body.getLastname()).isEqualTo("Kayttaja");
        assertThat(body.getEmail()).isEqualTo("testi@mail.fi");
    }

    @Test
    void getById_whenNotExists_returnsNotFound() {
        when(customerRepository.findById(99)).thenReturn(Optional.empty());

        ResponseEntity<?> response = customerController.getCustomerById(99);

        assertError(response, HttpStatus.NOT_FOUND, "Customer not found");
    }

    // POST /api/customers

    @Test
    void create_withValidData_returnsCreated() {
        when(customerRepository.save(any(Customer.class))).thenReturn(createCustomer());

        ResponseEntity<?> response = customerController.createCustomer(validDto());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        CustomerDTO body = (CustomerDTO) response.getBody();
        assertThat(body.getId()).isEqualTo(1);
        assertThat(body.getFirstname()).isEqualTo("Testi");

        ArgumentCaptor<Customer> captor = ArgumentCaptor.forClass(Customer.class);
        verify(customerRepository).save(captor.capture());

        Customer saved = captor.getValue();
        assertThat(saved.getId()).isNull();
        assertThat(saved.getFirstname()).isEqualTo("Testi");
        assertThat(saved.getLastname()).isEqualTo("Kayttaja");
        assertThat(saved.getEmail()).isEqualTo("testi@mail.fi");
    }

    @ParameterizedTest
    @MethodSource("invalidCustomers")
    void create_withInvalidData_returnsBadRequest(CustomerDTO dto, String expectedMessage) {
        ResponseEntity<?> response = customerController.createCustomer(dto);

        assertError(response, HttpStatus.BAD_REQUEST, expectedMessage);
        verify(customerRepository, never()).save(any());
    }

    @Test
    void create_whenRepositoryThrows_returnsBadRequest() {
        when(customerRepository.save(any(Customer.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate email"));

        ResponseEntity<?> response = customerController.createCustomer(validDto());

        assertError(response, HttpStatus.BAD_REQUEST, "Invalid customer data: duplicate email");
    }

    // PUT /api/customers/{id}

    @Test
    void update_withValidData_returnsOk() {
        Customer existing = createCustomer();
        CustomerDTO dto = new CustomerDTO(null, "Uusi", "Nimi", "uusi@mail.fi");

        when(customerRepository.findById(1)).thenReturn(Optional.of(existing));
        when(customerRepository.save(existing)).thenReturn(existing);

        ResponseEntity<?> response = customerController.updateCustomer(1, dto);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        CustomerDTO body = (CustomerDTO) response.getBody();
        assertThat(body.getId()).isEqualTo(1);
        assertThat(body.getFirstname()).isEqualTo("Uusi");
        assertThat(body.getLastname()).isEqualTo("Nimi");
        assertThat(body.getEmail()).isEqualTo("uusi@mail.fi");

        verify(customerRepository).save(existing);
    }

    @Test
    void update_whenNotExists_returnsNotFound() {
        when(customerRepository.findById(99)).thenReturn(Optional.empty());

        ResponseEntity<?> response = customerController.updateCustomer(99, validDto());

        assertError(response, HttpStatus.NOT_FOUND, "Customer not found");
        verify(customerRepository, never()).save(any());
    }

    @ParameterizedTest
    @MethodSource("invalidCustomers")
    void update_withInvalidData_returnsBadRequest(CustomerDTO dto, String expectedMessage) {
        when(customerRepository.findById(1)).thenReturn(Optional.of(createCustomer()));

        ResponseEntity<?> response = customerController.updateCustomer(1, dto);

        assertError(response, HttpStatus.BAD_REQUEST, expectedMessage);
        verify(customerRepository, never()).save(any());
    }

    @Test
    void update_whenNotExistsAndInvalidData_returnsNotFound() {
        when(customerRepository.findById(99)).thenReturn(Optional.empty());

        ResponseEntity<?> response = customerController.updateCustomer(
                99, new CustomerDTO(null, "", "", ""));

        assertError(response, HttpStatus.NOT_FOUND, "Customer not found");
    }

    // DELETE /api/customers/{id}

    @Test
    void delete_whenExists_returnsOk() {
        when(customerRepository.existsById(1)).thenReturn(true);

        ResponseEntity<?> response = customerController.deleteCustomerById(1);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody())
                .isEqualTo(Map.of("message", "Successfully deleted customer with id 1"));
        verify(customerRepository).deleteById(1);
    }

    @Test
    void delete_whenNotExists_returnsNotFound() {
        when(customerRepository.existsById(99)).thenReturn(false);

        ResponseEntity<?> response = customerController.deleteCustomerById(99);

        assertError(response, HttpStatus.NOT_FOUND, "Customer not found");
        verify(customerRepository, never()).deleteById(any());
    }
}
