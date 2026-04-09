package com.sliit.nexus.dto;

import jakarta.validation.constraints.NotBlank;

public record EditCommentRequest(
        @NotBlank String content) {
}
