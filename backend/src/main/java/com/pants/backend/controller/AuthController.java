package com.pants.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.dto.LoginRequest;
import com.pants.backend.service.JwtService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(
            AuthenticationConfiguration authenticationConfiguration,
            JwtService jwtService) throws Exception {

        this.authenticationManager =
                authenticationConfiguration.getAuthenticationManager();

        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest loginRequest) {

        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    loginRequest.getEmail(),
                                    loginRequest.getPassword()));

            String role = authentication.getAuthorities()
                    .stream()
                    .findFirst()
                    .map(authority ->
                            authority.getAuthority().replace("ROLE_", ""))
                    .orElse("");

            String token = jwtService.generateToken(authentication);

            return ResponseEntity.ok(Map.of(
                    "message", "Login successful",
                    "email", authentication.getName(),
                    "role", role,
                    "token", token));

        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message", "Invalid email or password"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Not signed in"));
        }

        String role = authentication.getAuthorities()
                .stream()
                .findFirst()
                .map(authority ->
                        authority.getAuthority().replace("ROLE_", ""))
                .orElse("");

        return ResponseEntity.ok(Map.of(
                "email", authentication.getName(),
                "role", role));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of(
                "message", "Logout successful"));
    }
}
