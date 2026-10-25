package com.pants.backend.controller;

import java.util.Map;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CsrfController {

    @GetMapping("/api/csrf")
    public Map<String, String> csrf(CsrfToken csrfToken) {
        return Map.of(
            "token", csrfToken.getToken(),
            "headerName", csrfToken.getHeaderName()
        );
    }
}