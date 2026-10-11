package com.pants.backend.controller;

import com.pants.backend.dto.ErrorResponse;
import com.pants.backend.dto.UserDTO;
import com.pants.backend.dto.UserRequestDTO;
import com.pants.backend.entity.Role;
import com.pants.backend.entity.User;
import com.pants.backend.repository.RoleRepository;
import com.pants.backend.repository.UserRepository;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

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
            @RequestBody UserRequestDTO request) {

        if (request.getPassword() == null
                || request.getPassword().isBlank()) {
            return ResponseEntity
                    .badRequest()
                    .body(new ErrorResponse(
                            400,
                            "Password is required"));
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

    @Operation(summary = "Update an existing user", description = "Updates information for an existing user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User updated successfully"),
            @ApiResponse(responseCode = "404", description = "User not found", content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "400", description = "Invalid user data", content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Integer id,
            @RequestBody UserRequestDTO request) {

        User existingUser = userRepository.findById(id)
                .orElse(null);

        if (existingUser == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(404, "User not found"));
        }

        try {
            if (request.getRoleId() != null) {
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

            if (request.getPassword() != null
                    && !request.getPassword().isBlank()) {
                existingUser.setPasswordHash(
                        passwordEncoder.encode(request.getPassword()));
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