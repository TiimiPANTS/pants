package com.pants.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.pants.backend.dto.ReservationDTO;
import com.pants.backend.entity.Reservation;
import com.pants.backend.repository.TableListRepository;
import com.pants.backend.repository.TableRepository;
import com.pants.backend.service.ReservationService;
import com.pants.backend.utils.TestDataFactory;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BackendApplicationTests {

	@LocalServerPort
	private int port;

	@Autowired
	private ReservationService reservationService;

	@Autowired
	private TableListRepository tableListRepository;

	@Autowired
	private TableRepository tableRepository;

	@ParameterizedTest
	@CsvSource({
		"1, 2", "2, 2", "3, 4", "4, 4", "5, 6",
		"6, 6", "7, 8", "8, 8", "9, 10", "10, 10"
	})
	@Transactional
	void defaultStartupDataSupportsBookingWithoutCreatingTestTables(int partySize, int expectedCapacity) {
		ReservationDTO dto = TestDataFactory.createReservationRequest("startup-booking@example.com",
				LocalDateTime.of(2027, 1, 11, 10, 0), LocalTime.of(10, 0), LocalTime.of(12, 0), partySize);

		Reservation saved = reservationService.createReservation(dto);

		assertThat(tableListRepository.findByIdReservationId(saved.getReservationId()))
				.singleElement().satisfies(assignment ->
						assertThat(tableRepository.findById(assignment.getId().getTableId())
								.orElseThrow().getCapacity()).isEqualTo(expectedCapacity));
	}

	@Test
	void contextLoads() {
	}

	@Test
	void reservationAvailabilityIsPublic() throws Exception {
		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(
						"http://localhost:" + port
								+ "/api/reservations/availability?from=2026-12-01&to=2026-12-31"
				))
				.GET()
				.build();
		HttpResponse<String> response = HttpClient.newHttpClient().send(
				request,
				HttpResponse.BodyHandlers.ofString()
		);

		assertThat(response.statusCode()).isEqualTo(200);
	}
}
