package com.sliit.nexus.dto;

import com.sliit.nexus.model.BookingStatus;
import java.time.Instant;

public record BookingResponse(
        String id,
        String requestedByUserId,
        String resourceName,
        String dateLabel,
        BookingStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
