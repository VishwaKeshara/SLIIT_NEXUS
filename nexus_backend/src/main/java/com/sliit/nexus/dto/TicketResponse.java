package com.sliit.nexus.dto;

import com.sliit.nexus.model.TicketStatus;
import java.time.Instant;
import java.util.List;

public record TicketResponse(
        String id,
        String createdByUserId,
        String title,
        String description,
        TicketStatus status,
        List<TicketCommentResponse> comments,
        Instant createdAt,
        Instant updatedAt
) {
}
