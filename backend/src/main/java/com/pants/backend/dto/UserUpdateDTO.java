package com.pants.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;


public class UserUpdateDTO {

    @Size(min = 1, max = 50)
    private String username;

    @Email
    @Size(max = 254)
    private String email;

    @Positive
    private Integer roleId;

    public UserUpdateDTO() {
    }

    public UserUpdateDTO(String username, String email, Integer roleId) {
        this.username = username;
        this.email = email;
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

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }
}
