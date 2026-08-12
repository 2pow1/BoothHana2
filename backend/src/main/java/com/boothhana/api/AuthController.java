package com.boothhana.api;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.web.csrf.CsrfToken;
import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @GetMapping("/csrf")
    Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken());
    }

    @GetMapping("/login")
    ResponseEntity<Void> login() {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create("/oauth2/authorization/kakao")).build();
    }
}
