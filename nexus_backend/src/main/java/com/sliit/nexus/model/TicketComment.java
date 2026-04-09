package com.sliit.nexus.model;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketComment {
    private String id;
    private String authorUserId;
    private String authorName;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;
}
