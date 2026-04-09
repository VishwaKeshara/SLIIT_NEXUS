package com.sliit.nexus.dto;

import jakarta.validation.constraints.NotBlank;

public record AssignTicketRequest(
        @NotBlank String assignedToUserId) {
}
