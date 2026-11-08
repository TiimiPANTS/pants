package com.pants.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class UserRequestDTO {

    @NotBlank
    @Size(max = 50)
    private String username;

    @NotBlank 
    @Email 
    @Size(max = 254)
    private String email;

    @Size(min = 8, max = 72)
    private String password;

    @Positive
    private Integer roleId;

    public UserRequestDTO() {
    }

    public UserRequestDTO(String username, String email, String password, Integer roleId) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.roleId = roleId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }
}