package com.sliit.nexus.controller;

import com.sliit.nexus.config.AppProperties;
import com.sliit.nexus.dto.AuthResponse;
import com.sliit.nexus.dto.DevLoginRequest;
import com.sliit.nexus.dto.SignInRequest;
import com.sliit.nexus.dto.SignUpRequest;
import com.sliit.nexus.dto.UpdateAccountRequest;
import com.sliit.nexus.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AppProperties appProperties;

    @GetMapping("/me")
    public AuthResponse me(Authentication authentication) {
        return authService.currentUser(authentication);
    }

    @PostMapping("/signup")
    public AuthResponse signUp(@Valid @RequestBody SignUpRequest request, HttpServletRequest httpRequest) {
        return authService.signUp(request.displayName(), request.email(), request.password(), httpRequest);
    }

    @PostMapping("/login")
    public AuthResponse signIn(@Valid @RequestBody SignInRequest request, HttpServletRequest httpRequest) {
        return authService.signIn(request.email(), request.password(), httpRequest);
    }

    @PostMapping("/dev-login")
    public AuthResponse devLogin(@Valid @RequestBody DevLoginRequest request, HttpServletRequest httpRequest) {
        if (!appProperties.security().devLoginEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Development login is disabled.");
        }
        return authService.devLogin(request.email(), httpRequest);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/account")
    public AuthResponse updateAccount(
            Authentication authentication,
            @Valid @RequestBody UpdateAccountRequest request,
            HttpServletRequest httpRequest
    ) {
        return authService.updateAccount(authentication, request.displayName(), request.email(), request.password(), httpRequest);
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(Authentication authentication, HttpServletRequest httpRequest) {
        authService.deleteAccount(authentication, httpRequest);
        return ResponseEntity.noContent().build();
    }
}
