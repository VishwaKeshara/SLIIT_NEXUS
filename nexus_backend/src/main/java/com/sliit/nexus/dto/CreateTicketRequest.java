package com.sliit.nexus.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTicketRequest(
        @NotBlank String title,
        @NotBlank String description,
        String category,
        @NotBlank String priority,
        String resourceId,
        @NotBlank String location,
        String preferredContact) {
}
