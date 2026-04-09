package com.sliit.nexus.dto;

import com.sliit.nexus.model.AppRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record UpdateUserRequest(
        @NotBlank @Size(min = 3, max = 80) String displayName,
        @NotBlank @Email String email,
        @Size(min = 8, max = 100) String password,
        @NotEmpty Set<AppRole> roles
) {
}
