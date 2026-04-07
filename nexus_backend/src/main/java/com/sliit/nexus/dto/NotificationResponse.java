package com.sliit.nexus.dto;

import com.sliit.nexus.model.NotificationType;
import java.time.Instant;

public record NotificationResponse(
        String id,
        NotificationType type,
        String title,
        String message,
        String entityType,
        String entityId,
        boolean read,
        Instant createdAt
) {
}
