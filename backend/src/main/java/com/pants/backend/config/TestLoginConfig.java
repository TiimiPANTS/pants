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

            Role ownerRole = roleRepository.findByName("OWNER")
                    .orElseGet(() -> roleRepository.save(new Role("OWNER")));

            Role employeeRole = roleRepository.findByName("EMPLOYEE")
                    .orElseGet(() -> roleRepository.save(new Role("EMPLOYEE")));

            // ADMIN
            if (userRepository.findByEmail("admin@test.com").isEmpty()) {
                User admin = new User();

                admin.setUsername("admin");
                admin.setEmail("admin@test.com");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setRole(adminRole);

                userRepository.save(admin);

                System.out.println("Admin user created: admin@test.com / admin123");
            }

            // OWNER
            if (userRepository.findByEmail("owner@test.com").isEmpty()) {
                User owner = new User();

                owner.setUsername("owner");
                owner.setEmail("owner@test.com");
                owner.setPasswordHash(passwordEncoder.encode("owner123"));
                owner.setRole(ownerRole);

                userRepository.save(owner);

                System.out.println("Owner user created: owner@test.com / owner123");
            }

            // EMPLOYEE
            if (userRepository.findByEmail("employee@test.com").isEmpty()) {
                User employee = new User();

                employee.setUsername("employee");
                employee.setEmail("employee@test.com");
                employee.setPasswordHash(passwordEncoder.encode("employee123"));
                employee.setRole(employeeRole);

                userRepository.save(employee);

                System.out.println("Employee user created: employee@test.com / employee123");
            }
        };
    }
}