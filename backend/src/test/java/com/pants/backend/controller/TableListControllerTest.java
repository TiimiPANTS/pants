package com.pants.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static com.pants.backend.utils.TestDataFactory.createReservation;
import static com.pants.backend.utils.TestDataFactory.createTable;
import static com.pants.backend.utils.TestDataFactory.createTableList;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.entity.Reservation;
import com.pants.backend.entity.TableList;
import com.pants.backend.entity.TableList.TableListId;
import com.pants.backend.repository.ReservationRepository;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.repository.TableRepository;
import com.pants.backend.service.TableService;

@ExtendWith(MockitoExtension.class)
class TableListControllerTest {

        @Mock
        private TableListRepository tableListRepository;

        @Mock
        private ReservationRepository reservationRepository;

        @Mock
        private TableRepository tableRepository;

        @Mock
        private TableService tableService;

        @InjectMocks
        private TableListController tableListController;

        private void mockReservationExists() {
                when(reservationRepository.findById(1))
                                .thenReturn(Optional.of(createReservation()));
        }

        private void mockReservationExists(int reservationId, Reservation reservation) {
                when(reservationRepository.findById(reservationId))
                                .thenReturn(Optional.of(reservation));
        }

        private void mockTableExists() {
                when(tableRepository.findById(1))
                                .thenReturn(Optional.of(createTable()));
        }

        private void assertErrorResponse(ResponseEntity<?> response, HttpStatus status, String message) {
                assertThat(response.getStatusCode()).isEqualTo(status);

                ErrorResponse error = (ErrorResponse) response.getBody();
                assertThat(error).isNotNull();
                assertThat(error.getStatus()).isEqualTo(status.value());
                assertThat(error.getMessage()).isEqualTo(message);
        }

        @Test
        void getAll_whenTableListsExist_returnsOk() {
                TableList tableList = createTableList();

                when(tableListRepository.findAll())
                                .thenReturn(List.of(tableList));

                ResponseEntity<?> response = tableListController.getAll();

                assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
                assertThat(response.getBody()).isEqualTo(List.of(tableList));
        }

        @Test
        void getAll_whenNoTableListsExist_returnsNotFound() {
                when(tableListRepository.findAll())
                                .thenReturn(Collections.emptyList());

                ResponseEntity<?> response = tableListController.getAll();

                assertErrorResponse(response, HttpStatus.NOT_FOUND, "No tablelists found");
        }

        @Test
        void getById_whenFound_returnsOk() {
                TableList tableList = createTableList();

                when(tableListRepository.findById(tableList.getId()))
                                .thenReturn(Optional.of(tableList));

                ResponseEntity<?> response = tableListController.getById(1, 1);

                assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
                assertThat(response.getBody()).isEqualTo(tableList);
        }

        @Test
        void getById_whenNotFound_returnsNotFound() {
                TableListId id = new TableListId(1, 1);

                when(tableListRepository.findById(id))
                                .thenReturn(Optional.empty());

                ResponseEntity<?> response = tableListController.getById(1, 1);

                assertErrorResponse(response, HttpStatus.NOT_FOUND, "Tablelist not found");
        }

        @Test
        void create_whenReservationMissing_returnsNotFound() {
                TableList tableList = createTableList();

                when(reservationRepository.findById(1))
                                .thenReturn(Optional.empty());

                ResponseEntity<?> response = tableListController.create(tableList);

                assertErrorResponse(response, HttpStatus.NOT_FOUND, "Reservation with id 1 does not exist");
                verify(tableRepository, never()).findById(anyInt());
                verify(tableListRepository, never()).save(any());
        }

        @Test
        void create_whenTableMissing_returnsNotFound() {
                TableList tableList = createTableList();

                mockReservationExists();
                when(tableRepository.findById(1))
                                .thenReturn(Optional.empty());

                ResponseEntity<?> response = tableListController.create(tableList);

                assertErrorResponse(response, HttpStatus.NOT_FOUND, "Table with id 1 does not exist");
                verify(tableListRepository, never()).save(any());
        }

        @Test
        void create_whenAlreadyExists_returnsBadRequest() {
                TableList tableList = createTableList();

                mockReservationExists();
                mockTableExists();
                when(tableListRepository.existsById(tableList.getId()))
                                .thenReturn(true);

                ResponseEntity<?> response = tableListController.create(tableList);

                assertErrorResponse(response, HttpStatus.BAD_REQUEST, "Tablelist already exists");
                verify(tableListRepository, never()).save(any());
        }

        @Test
        void create_whenCapacityTooSmall_returnsBadRequest() {
                TableList tableList = createTableList();

                mockReservationExists();
                mockTableExists();
                when(tableListRepository.existsById(tableList.getId()))
                                .thenReturn(false);
                when(tableService.hasCapacityFor(any(), anyInt()))
                                .thenReturn(false);

                ResponseEntity<?> response = tableListController.create(tableList);

                assertErrorResponse(response, HttpStatus.BAD_REQUEST,
                                "Table with id 1 does not have enough capacity for party size 4");
                verify(tableListRepository, never()).save(any());
        }

        @Test
        void create_whenUnavailable_returnsConflict() {
                TableList tableList = createTableList();
                Reservation reservation = createReservation();

                mockReservationExists(1, reservation);
                mockTableExists();
                when(tableListRepository.existsById(tableList.getId()))
                                .thenReturn(false);
                when(tableService.hasCapacityFor(any(), anyInt()))
                                .thenReturn(true);
                when(tableService.isAvailable(anyInt(), any(), any(), any()))
                                .thenReturn(false);

                ResponseEntity<?> response = tableListController.create(tableList);

                assertErrorResponse(response, HttpStatus.CONFLICT, "Table with id 1 is already reserved for that time");
                verify(tableListRepository, never()).save(any());
        }

        @Test
        void create_whenValid_returnsCreated() {
                TableList tableList = createTableList();
                Reservation reservation = createReservation();

                mockReservationExists(1, reservation);
                mockTableExists();
                when(tableListRepository.existsById(tableList.getId()))
                                .thenReturn(false);
                when(tableService.hasCapacityFor(any(), anyInt()))
                                .thenReturn(true);
                when(tableService.isAvailable(anyInt(), any(), any(), any()))
                                .thenReturn(true);
                when(tableListRepository.save(tableList))
                                .thenReturn(tableList);

                ResponseEntity<?> response = tableListController.create(tableList);

                assertThat(response.getStatusCode())
                                .isEqualTo(HttpStatus.CREATED);
                assertThat(response.getBody())
                                .isEqualTo(tableList);

                verify(tableListRepository).save(tableList);
        }

        @Test
        void delete_whenFound_returnsOk() {
                TableListId id = new TableListId(1, 1);

                when(tableListRepository.existsById(id))
                                .thenReturn(true);

                ResponseEntity<?> response = tableListController.delete(1, 1);

                assertThat(response.getStatusCode())
                                .isEqualTo(HttpStatus.OK);

                verify(tableListRepository).deleteById(id);
        }

        @Test
        void delete_whenNotFound_returnsNotFound() {
                TableListId id = new TableListId(1, 1);

                when(tableListRepository.existsById(id))
                                .thenReturn(false);

                ResponseEntity<?> response = tableListController.delete(1, 1);

                assertThat(response.getStatusCode())
                                .isEqualTo(HttpStatus.NOT_FOUND);
        }

}