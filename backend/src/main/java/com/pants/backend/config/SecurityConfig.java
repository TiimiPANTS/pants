package com.pants.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        return http
                .cors(Customizer.withDefaults())

                // JWT authentication does not use session cookies
                .csrf(csrf -> csrf.disable())

                // Do not use HTTP sessions for authentication
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Disable old authentication methods
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())

                // Enable JWT Bearer authentication
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt
                                .jwtAuthenticationConverter(
                                        jwtAuthenticationConverter())))

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

                        // Current authenticated user
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/auth/me")
                        .authenticated()

                        // Swagger documentation
                        .requestMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml")
                        .permitAll()

                        // Health endpoints
                        .requestMatchers(
                                HttpMethod.GET,
                                "/",
                                "/hello")
                        .permitAll()

                        // Public reservation creation
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/reservations")
                        .permitAll()

                        // Reservation availability
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations/availability")
                        .permitAll()

                        // Public reservation management
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/reservations/manage/*")
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/manage/*")
                        .permitAll()

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/reservations/manage/*/cancel")
                        .permitAll()

                        // Create receipt using reservation token
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/receipts/*")
                        .permitAll()

                        // =====================================
                        // USER ACCOUNT
                        // =====================================

                        // View own account
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/users/me")
                        .hasAnyRole("ADMIN", "OWNER")

                        // Change own password
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/me/password")
                        .hasAnyRole("ADMIN", "OWNER")

                        // Update own account information
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/users/*")
                        .hasAnyRole("ADMIN", "OWNER")

                        // Create new users
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/users")
                        .hasAnyRole("ADMIN", "OWNER")

                        // =====================================
                        // ADMIN ONLY
                        // =====================================

                        // User and role management
                        .requestMatchers(
                                "/api/users",
                                "/api/users/**")
                        .hasRole("ADMIN")

                        // Delete reservations and receipts
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/reservations/*",
                                "/api/receipts/*")
                        .hasRole("ADMIN")

                        // =====================================
                        // ADMIN AND OWNER
                        // =====================================

                        // View receipts
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/receipts",
                                "/api/receipts/*")
                        .hasAnyRole("ADMIN", "OWNER")

                        // Create tables
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tables")
                        .hasAnyRole("ADMIN", "OWNER")

                        // Update tables
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/tables/*")
                        .hasAnyRole("ADMIN", "OWNER")

                        // Delete customers and tables
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/customers/*",
                                "/api/tables/*")
                        .hasAnyRole("ADMIN", "OWNER")

                        // Cancel reservations
                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/reservations/*/cancel")
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
                                "/api/reservations/*")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // Update reservations
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/reservations/*")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // View customers
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/customers",
                                "/api/customers/*")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // Create customers
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/customers")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // Update customers
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/customers/*")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // View tables
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tables",
                                "/api/tables/*")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // View table assignments
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/tablelists",
                                "/api/tablelists/*/*")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // Assign tables to reservations
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/tablelists")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // Remove table assignments
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/tablelists/*/*")
                        .hasAnyRole(
                                "ADMIN", "OWNER", "EMPLOYEE")

                        // =====================================
                        // OTHER ENDPOINTS
                        // =====================================

                        // Unlisted endpoints: ADMIN only
                        .anyRequest()
                        .hasRole("ADMIN"))

                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED)))

                .build();
    }

    // Convert JWT roles to Spring Security authorities
    private static JwtAuthenticationConverter jwtAuthenticationConverter() {

        JwtGrantedAuthoritiesConverter authoritiesConverter =
                new JwtGrantedAuthoritiesConverter();

        authoritiesConverter.setAuthoritiesClaimName("roles");
        authoritiesConverter.setAuthorityPrefix("");

        JwtAuthenticationConverter authenticationConverter =
                new JwtAuthenticationConverter();

        authenticationConverter.setJwtGrantedAuthoritiesConverter(
                authoritiesConverter);

        return authenticationConverter;
    }
}
