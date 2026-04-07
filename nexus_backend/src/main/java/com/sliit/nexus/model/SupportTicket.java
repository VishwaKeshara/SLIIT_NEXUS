package com.sliit.nexus.model;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
@Document("tickets")
public class SupportTicket {
    @Id
    private String id;

    private String createdByUserId;
    private String title;
    private String description;
    private TicketStatus status;

    @Builder.Default
    private List<TicketComment> comments = new ArrayList<>();

    private Instant createdAt;
    private Instant updatedAt;
}
