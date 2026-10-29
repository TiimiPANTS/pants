package com.pants.backend.dto;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;

class TableDTOTest {

    private final Validator validator =
            Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void validate_whenFieldsValid_hasNoViolations() {
        TableDTO dto = new TableDTO(null, 1, 4);

        Set<ConstraintViolation<TableDTO>> violations = validator.validate(dto);

        assertThat(violations).isEmpty();
    }

    @Test
    void validate_whenTableNumberZero_returnsTableNumberViolation() {
        TableDTO dto = new TableDTO(null, 0, 4);

        Set<ConstraintViolation<TableDTO>> violations = validator.validate(dto);

        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .containsExactly("Table number must be at least 1");
    }

    @Test
    void validate_whenCapacityNegative_returnsCapacityViolation() {
        TableDTO dto = new TableDTO(null, 1, -2);

        Set<ConstraintViolation<TableDTO>> violations = validator.validate(dto);

        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .containsExactly("Capacity must be at least 1");
    }

    @Test
    void validate_whenFieldsMissing_returnsBothViolations() {
        TableDTO dto = new TableDTO();

        Set<ConstraintViolation<TableDTO>> violations = validator.validate(dto);

        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .containsExactlyInAnyOrder(
                        "Table number is required",
                        "Capacity is required"
                );
    }
}