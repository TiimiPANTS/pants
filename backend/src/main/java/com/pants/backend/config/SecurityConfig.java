package com.pants.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())

                .csrf(csrf -> csrf
                        .ignoringRequestMatchers(
                                "/api/auth/login",
                                "/api/auth/logout"
                        )
                        .ignoringRequestMatchers(
                                SecurityConfig::isPublicMutationWithoutCsrf
                        )
                )

                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/logout",

                                // Swagger
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml"
                        )
                        .permitAll()

                        // Public reservation endpoints
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reservations"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations/manage/*"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/manage/*"
                        )
                        .permitAll()

                        // Public receipt creation
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/receipts/*"
                        )
                        .permitAll()

                        // Everything else requires authentication
                        .anyRequest()
                        .authenticated()
                )

                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )
                )

                .build();
    }

    private static boolean isPublicMutationWithoutCsrf(
            HttpServletRequest request
    ) {
        String method = request.getMethod();
        String path = request.getServletPath();

        return (HttpMethod.POST.matches(method)
                        && "/api/reservations".equals(path))
                || (HttpMethod.PUT.matches(method)
                        && path.startsWith(
                                "/api/reservations/manage/"
                        ))
                || (HttpMethod.POST.matches(method)
                        && path.matches(
                                "/api/receipts/\\d+"
                        ));
    }
}