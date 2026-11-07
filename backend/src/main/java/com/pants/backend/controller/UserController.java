package com.pants.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.dto.PasswordChangeRequestDTO;
import com.pants.backend.dto.UserDTO;
import com.pants.backend.dto.UserRequestDTO;
import com.pants.backend.dto.UserUpdateDTO;
import com.pants.backend.entity.Role;
import com.pants.backend.entity.User;
import com.pants.backend.repository.RoleRepository;
import com.pants.backend.repository.UserRepository;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User API", description = "Endpoints for managing users")
public class UserController {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;

        public UserController(
                        UserRepository userRepository,
                        RoleRepository roleRepository,
                        PasswordEncoder passwordEncoder) {
                this.userRepository = userRepository;
                this.roleRepository = roleRepository;
                this.passwordEncoder = passwordEncoder;
        }

        @Operation(summary = "Get all users", description = "Returns a list of all users")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Users found successfully"),
                        @ApiResponse(responseCode = "404", description = "No users found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping
        public ResponseEntity<?> getAllUsers() {

                List<UserDTO> users = userRepository.findAll()
                                .stream()
                                .map(this::convertToDTO)
                                .toList();

                if (users.isEmpty()) {
                        return ResponseEntity
                                        .status(HttpStatus.NOT_FOUND)
                                        .body(new ErrorResponse(404, "No users found"));
                }

                return ResponseEntity.ok(users);
        }

        @Operation(summary = "Get user by ID", description = "Returns a single user by their ID")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "User found"),
                        @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
        })
        @GetMapping("/{id}")
        public ResponseEntity<?> getUserById(@PathVariable Integer id) {

                return userRepository.findById(id)
                                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(convertToDTO(user)))
                                .orElseGet(() -> ResponseEntity
                                                .status(HttpStatus.NOT_FOUND)
                                                .body(new ErrorResponse(
                                                                404,
                                                                "User not found")));
        }

        @Operation(summary = "Create a new user", description = "Adds a new user to the system")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "201", description = "User created successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid user data", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
        })
        @PostMapping
        public ResponseEntity<?> createUser(
                        @Valid @RequestBody UserRequestDTO request) {

                if (request.getPassword() == null
                                || request.getPassword().isBlank()) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new ErrorResponse(
                                                        400,
                                                        "Password is required"));
                }

                if (request.getRoleId() == null) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new ErrorResponse(
                                                        400,
                                                        "Role ID is required"));
                }

                try {
                        Role role = roleRepository.findById(request.getRoleId())
                                        .orElse(null);

                        if (role == null) {
                                return ResponseEntity
                                                .badRequest()
                                                .body(new ErrorResponse(
                                                                400,
                                                                "Invalid role ID"));
                        }

                        // Vain admin saa luoda admin-käyttäjiä
                        if ("ADMIN".equals(role.getName())) {
                                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                                User loggedInUser = authentication == null
                                                ? null
                                                : userRepository.findByEmail(authentication.getName()).orElse(null);

                                boolean isAdmin = loggedInUser != null
                                                && loggedInUser.getRole() != null
                                                && "ADMIN".equals(loggedInUser.getRole().getName());

                                if (!isAdmin) {
                                        return ResponseEntity
                                                        .status(HttpStatus.FORBIDDEN)
                                                        .body(new ErrorResponse(
                                                                        403,
                                                                        "Only admins can create admin users"));
                                }
                        }

                        User user = new User();
                        user.setUsername(request.getUsername());
                        user.setEmail(request.getEmail());
                        user.setPasswordHash(
                                        passwordEncoder.encode(request.getPassword()));
                        user.setRole(role);

                        User savedUser = userRepository.save(user);

                        return ResponseEntity
                                        .status(HttpStatus.CREATED)
                                        .body(convertToDTO(savedUser));

                } catch (Exception e) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new ErrorResponse(
                                                        400,
                                                        "Could not create user"));
                }
        }

        @Operation(summary = "Get current user's account information")

        @GetMapping("/me")
        public ResponseEntity<?> getCurrentUser() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null
                                || !authentication.isAuthenticated()
                                || authentication.getName().equals("anonymousUser")) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(new ErrorResponse(401, "You must be logged in"));
                }

                User user = userRepository.findByEmail(authentication.getName())
                                .orElse(null);

                if (user == null) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(new ErrorResponse(404, "User not found"));
                }

                return ResponseEntity.ok(convertToDTO(user));
        }

        @Operation(summary = "Update an existing user", description = "Updates information for an existing user")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "User updated successfully"),
                        @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
                        @ApiResponse(responseCode = "400", description = "Invalid user data", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
        })

        @PutMapping("/{id}")
        public ResponseEntity<?> updateUser(
                        @PathVariable Integer id,
                        @Valid @RequestBody UserUpdateDTO request) {

                User existingUser = userRepository.findById(id)
                                .orElse(null);

                if (existingUser == null) {
                        return ResponseEntity
                                        .status(HttpStatus.NOT_FOUND)
                                        .body(new ErrorResponse(404, "User not found"));
                }

                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null
                                || !authentication.isAuthenticated()
                                || authentication.getName().equals("anonymousUser")) {
                        return ResponseEntity
                                        .status(HttpStatus.UNAUTHORIZED)
                                        .body(new ErrorResponse(401, "You must be logged in"));
                }

                String loggedInEmail = authentication.getName();

                User loggedInUser = userRepository.findByEmail(loggedInEmail)
                                .orElse(null);

                if (loggedInUser == null || !loggedInUser.getId().equals(id)) {
                        return ResponseEntity
                                        .status(HttpStatus.FORBIDDEN)
                                        .body(new ErrorResponse(403, "You can only edit your own account"));
                }

                try {
                        if (request.getRoleId() != null) {
                                boolean isAdmin = loggedInUser.getRole() != null
                                                && "ADMIN".equals(loggedInUser.getRole().getName());

                                if (!isAdmin) {
                                        return ResponseEntity
                                                        .status(HttpStatus.FORBIDDEN)
                                                        .body(new ErrorResponse(
                                                                        403,
                                                                        "Only admins can change roles"));
                                }

                                Role role = roleRepository
                                                .findById(request.getRoleId())
                                                .orElse(null);

                                if (role == null) {
                                        return ResponseEntity
                                                        .badRequest()
                                                        .body(new ErrorResponse(
                                                                        400,
                                                                        "Invalid role ID"));
                                }

                                existingUser.setRole(role);
                        }

                        if (request.getUsername() != null) {
                                existingUser.setUsername(request.getUsername());
                        }

                        if (request.getEmail() != null) {
                                existingUser.setEmail(request.getEmail());
                        }

                        User updatedUser = userRepository.save(existingUser);

                        return ResponseEntity.ok(convertToDTO(updatedUser));

                } catch (Exception e) {
                        return ResponseEntity
                                        .badRequest()
                                        .body(new ErrorResponse(
                                                        400,
                                                        "Could not update user"));
                }
        }

        @Operation(summary = "Update an existing user's password")

        @PutMapping("/me/password")
        public ResponseEntity<?> changePassword(
                        @Valid @RequestBody PasswordChangeRequestDTO request) {

                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

                if (authentication == null
                                || !authentication.isAuthenticated()
                                || authentication.getName().equals("anonymousUser")) {
                        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                        .body(new ErrorResponse(401, "You must be logged in"));
                }

                User user = userRepository.findByEmail(authentication.getName())
                                .orElse(null);

                if (user == null) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(new ErrorResponse(404, "User not found"));
                }

                if (request.getCurrentPassword() == null
                                || request.getCurrentPassword().isBlank()
                                || request.getNewPassword() == null
                                || request.getNewPassword().isBlank()) {
                        return ResponseEntity.badRequest()
                                        .body(new ErrorResponse(400, "Both password fields are required"));
                }
                if (!passwordEncoder.matches(
                                request.getCurrentPassword(),
                                user.getPasswordHash())) {
                        return ResponseEntity.badRequest()
                                        .body(new ErrorResponse(400, "Current password is incorrect"));
                }

                user.setPasswordHash(
                                passwordEncoder.encode(request.getNewPassword()));

                userRepository.save(user);

                return ResponseEntity.ok(
                                Map.of("message", "Password updated successfully"));
        }

        private UserDTO convertToDTO(User user) {
                return new UserDTO(
                                user.getId(),
                                user.getUsername(),
                                user.getEmail(),
                                user.getRole() != null
                                                ? user.getRole().getId()
                                                : null);
        }
}