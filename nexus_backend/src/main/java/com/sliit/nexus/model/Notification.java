package com.sliit.nexus.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("notifications")
public class Notification {
    @Id
    private String id;

    private String userId;
    private NotificationType type;
    private String title;
    private String message;
    private String entityType;
    private String entityId;
    private boolean read;
    private Instant createdAt;
}
