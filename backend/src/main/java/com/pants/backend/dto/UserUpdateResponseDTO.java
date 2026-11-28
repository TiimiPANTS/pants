package com.pants.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * The updated user, plus a new sign-in token when the email changed.
 * The token is left out of the JSON when it is null.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserUpdateResponseDTO extends UserDTO {

    private final String token;

    public UserUpdateResponseDTO(UserDTO user, String token) {
        super(user.getId(), user.getUsername(), user.getEmail(), user.getRoleId());
        this.token = token;
    }

    public String getToken() {
        return token;
    }
}
