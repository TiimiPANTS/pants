
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
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        return http
                .cors(Customizer.withDefaults())

                // Swagger HTTP Basic authentication
                // Prevent browser login popup
                .httpBasic(basic -> basic
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED
                                )
                        )
                )

                // CSRF protection
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

                        // =====================================
                        // PUBLIC ENDPOINTS
                        // =====================================

                        // Authentication
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/logout",
                                "/api/auth/csrf"
                        )
                        .permitAll()

                        // Swagger documentation
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml"
                        )
                        .permitAll()

                        // Public health endpoints
                        .requestMatchers(
                                HttpMethod.GET,
                                "/",
                                "/hello"
                        )
                        .permitAll()

                        // Create reservation
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reservations"
                        )
                        .permitAll()

                        // View reservation using edit token
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations/availability"
                        )
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations/manage/*"
                        )
                        .permitAll()

                        // Update reservation using edit token
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/manage/*"
                        )
                        .permitAll()

                        // Cancel reservation using edit token
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/reservations/manage/*/cancel"
                        )
                        .permitAll()

                        // Create receipt using reservation token
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/receipts/*"
                        )
                        .permitAll()

                        // =====================================
                        // ADMIN ONLY
                        // =====================================

                        // User and role management
                        .requestMatchers(
                                "/api/users",
                                "/api/users/**"
                        )
                        .hasRole("ADMIN")

                        // Delete reservations and receipts
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/reservations/*",
                                "/api/receipts/*"
                        )
                        .hasRole("ADMIN")

                        // =====================================
                        // ADMIN AND OWNER
                        // =====================================

                        // View receipts
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/receipts",
                                "/api/receipts/*"
                        )
                        .hasAnyRole("ADMIN", "OWNER")

                        // Create tables
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tables"
                        )
                        .hasAnyRole("ADMIN", "OWNER")

                        // Update tables
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/tables/*"
                        )
                        .hasAnyRole("ADMIN", "OWNER")

                        // Delete customers and tables
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/customers/*",
                                "/api/tables/*"
                        )
                        .hasAnyRole("ADMIN", "OWNER")

                        // Cancel reservations
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/reservations/*/cancel"
                        )
                        .hasAnyRole("ADMIN", "OWNER")

                        // =====================================
                        // ADMIN, OWNER AND EMPLOYEE
                        // =====================================

                        // View reservations
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations",
                                "/api/reservations/*"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // Update reservations
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/*"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // View customers
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/customers",
                                "/api/customers/*"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // Create customers
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/customers"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // Update customers
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/customers/*"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // View tables
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tables",
                                "/api/tables/*"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // View table assignments
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tablelists",
                                "/api/tablelists/*/*"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // Assign tables to reservations
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tablelists"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // Remove table assignments
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/tablelists/*/*"
                        )
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE"
                        )

                        // =====================================
                        // OTHER ENDPOINTS
                        // =====================================

                        // Unlisted endpoints: ADMIN only
                        .anyRequest()
                        .hasRole("ADMIN")
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
                        && path.matches(
                                "/api/reservations/manage/[^/]+"
                        ))

                || (HttpMethod.PATCH.matches(method)
                        && path.matches(
                                "/api/reservations/manage/[^/]+/cancel"
                        ))

                || (HttpMethod.POST.matches(method)
                        && path.matches(
                                "/api/receipts/\\d+"
                        ));
    }
}
