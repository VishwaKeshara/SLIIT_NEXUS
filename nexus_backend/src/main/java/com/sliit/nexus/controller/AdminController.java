package com.sliit.nexus.controller;

import com.sliit.nexus.dto.CreateUserRequest;
import com.sliit.nexus.dto.UpdateUserRequest;
import com.sliit.nexus.dto.UpdateRolesRequest;
import com.sliit.nexus.dto.UserSummaryResponse;
import com.sliit.nexus.service.UserAccountService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping({"/api/admin", "/api"})
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserAccountService userAccountService;

    @GetMapping("/users")
    public List<UserSummaryResponse> listUsers() {
        return userAccountService.listUsers();
    }

    @PostMapping("/users")
    public UserSummaryResponse createUser(@Valid @RequestBody CreateUserRequest request) {
        return userAccountService.createUser(request.displayName(), request.email(), request.password(), request.roles());
    }

    @PutMapping("/users/{userId}")
    public UserSummaryResponse updateUser(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return userAccountService.updateUser(userId, request.displayName(), request.email(), request.password(), request.roles());
    }

    @PatchMapping("/users/{userId}/roles")
    public UserSummaryResponse updateRoles(
            @PathVariable String userId,
            @Valid @RequestBody UpdateRolesRequest request
    ) {
        return userAccountService.updateRoles(userId, request.roles());
    }

    @DeleteMapping("/users/{userId}")
    public void deleteUser(@PathVariable String userId) {
        userAccountService.deleteUser(userId);
    }
}
