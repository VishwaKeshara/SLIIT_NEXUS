package com.sliit.nexus.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateAccountRequest(
        @NotBlank @Size(min = 3, max = 80) String displayName,
        @NotBlank @Email String email,
        @Size(min = 8, max = 100) String password
) {
}
