package com.pants.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;

import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.dto.UserRequestDTO;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    // Apumetodi, jota tarvitaan vain MethodParameterin luomiseen
    @SuppressWarnings("unused")
    private void dummy(UserRequestDTO request) {
    }

    private MethodArgumentNotValidException exceptionWith(BeanPropertyBindingResult bindingResult)
            throws NoSuchMethodException {
        MethodParameter parameter = new MethodParameter(
                getClass().getDeclaredMethod("dummy", UserRequestDTO.class), 0);
        return new MethodArgumentNotValidException(parameter, bindingResult);
    }

    @Test
    void returnsBadRequestWithFieldNameAndMessage() throws Exception {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(new UserRequestDTO(), "request");
        bindingResult.rejectValue("email", "Email", "must be a well-formed email address");

        ResponseEntity<ErrorResponse> response =
                handler.handleValidationErrors(exceptionWith(bindingResult));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getMessage())
                .isEqualTo("Invalid data: email: must be a well-formed email address");
    }

    @Test
    void joinsMultipleFieldErrors() throws Exception {
        BeanPropertyBindingResult bindingResult =
                new BeanPropertyBindingResult(new UserRequestDTO(), "request");
        bindingResult.rejectValue("username", "NotBlank", "must not be blank");
        bindingResult.rejectValue("email", "NotBlank", "must not be blank");

        ResponseEntity<ErrorResponse> response =
                handler.handleValidationErrors(exceptionWith(bindingResult));

        assertThat(response.getBody().getMessage())
                .isEqualTo("Invalid data: username: must not be blank, email: must not be blank");
    }
}
