package com.sliit.nexus.controller;

import com.sliit.nexus.dto.UpdateRolesRequest;
import com.sliit.nexus.dto.UserSummaryResponse;
import com.sliit.nexus.service.UserAccountService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserAccountService userAccountService;

    @GetMapping("/users")
    public List<UserSummaryResponse> listUsers() {
        return userAccountService.listUsers();
    }

    @PatchMapping("/users/{userId}/roles")
    public UserSummaryResponse updateRoles(
            @PathVariable String userId,
            @Valid @RequestBody UpdateRolesRequest request
    ) {
        return userAccountService.updateRoles(userId, request.roles());
    }
}
