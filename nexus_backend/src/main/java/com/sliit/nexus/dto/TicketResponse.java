package com.sliit.nexus.dto;

import com.sliit.nexus.model.TicketStatus;
import java.time.Instant;
import java.util.List;

public record TicketResponse(
                String id,
                String createdByUserId,
                String title,
                String description,
                String category,
                String priority,
                String location,
                String resourceId,
                String preferredContact,
                TicketStatus status,
                String assignedToUserId,
                String resolutionNotes,
                String rejectionReason,
                List<String> imageAttachments,
                List<TicketCommentResponse> comments,
                Instant createdAt,
                Instant updatedAt) {
}
