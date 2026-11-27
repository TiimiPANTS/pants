package com.pants.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.pants.backend.entity.Role;
import com.pants.backend.entity.User;
import com.pants.backend.repository.RoleRepository;
import com.pants.backend.repository.UserRepository;

@Configuration
public class TestLoginConfig {

    @Bean
    public CommandLineRunner createTestUsers(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            // Create roles if they do not already exist
            Role adminRole = roleRepository.findByName("ADMIN")
                    .orElseGet(() -> roleRepository.save(new Role("ADMIN")));

            roleRepository.findByName("OWNER")
                    .orElseGet(() -> roleRepository.save(new Role("OWNER")));

            roleRepository.findByName("EMPLOYEE")
                    .orElseGet(() -> roleRepository.save(new Role("EMPLOYEE")));

            // ADMIN
            if (userRepository.findByEmail("admin@pants.com").isEmpty()) {
                User admin = new User();

                admin.setUsername("admin");
                admin.setEmail("admin@pants.com");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setRole(adminRole);

                userRepository.save(admin);

                System.out.println("Admin user created: admin@pants.com");
            }
        };
    }
}