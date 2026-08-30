package com.pants.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/")
    public String home() {
        return "Team Pants API is running!";
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello Team Pants!";
    }
}