package com.sliit.nexus.dto;

import java.time.Instant;

public record TicketCommentResponse(
                String id,
                String authorUserId,
                String authorName,
                String content,
                Instant createdAt,
                Instant updatedAt) {
}
