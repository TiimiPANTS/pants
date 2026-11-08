package com.pants.backend.service;

import java.time.Instant;
import java.time.Duration;
import java.util.Base64;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final long expirationMinutes;

    public JwtService(
            @Value("${jwt.secret}") String secretBase64,
            @Value("${jwt.expiration-minutes}") long expirationMinutes) {

        byte[] secret = Base64.getDecoder().decode(secretBase64);

        if (secret.length < 32) {
            throw new IllegalArgumentException(
                    "JWT secret must contain at least 32 bytes");
        }

        SecretKey key = new SecretKeySpec(secret, "HmacSHA256");

        this.jwtEncoder = NimbusJwtEncoder
                .withSecretKey(key)
                .algorithm(MacAlgorithm.HS256)
                .build();

        this.expirationMinutes = expirationMinutes;
    }

    public String generateToken(Authentication authentication) {

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("le-pants")
                .subject(authentication.getName())
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofMinutes(expirationMinutes)))
                .claim("roles", authentication.getAuthorities()
                        .stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList())
                .build();

        JwsHeader header = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        return jwtEncoder.encode(
                JwtEncoderParameters.from(header, claims)
        ).getTokenValue();
    }
}
