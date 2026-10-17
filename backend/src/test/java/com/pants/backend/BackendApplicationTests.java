package com.pants.backend;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class BackendApplicationTests {

	@LocalServerPort
	private int port;

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
