package com.sliit.nexus.service;

import com.sliit.nexus.dto.TicketCommentResponse;
import com.sliit.nexus.dto.TicketResponse;
import com.sliit.nexus.model.NotificationType;
import com.sliit.nexus.model.SupportTicket;
import com.sliit.nexus.model.TicketComment;
import com.sliit.nexus.model.TicketStatus;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.repository.SupportTicketRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final NotificationService notificationService;
    private final UserAccountService userAccountService;

    public List<TicketResponse> listForUser(String userId, boolean elevatedAccess) {
        List<SupportTicket> tickets = elevatedAccess
                ? supportTicketRepository.findAll()
                : supportTicketRepository.findByCreatedByUserIdOrderByCreatedAtDesc(userId);
        return tickets.stream().map(this::toResponse).toList();
    }

    public TicketResponse updateStatus(String ticketId, TicketStatus status) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));

        ticket.setStatus(status);
        ticket.setUpdatedAt(Instant.now());
        SupportTicket saved = supportTicketRepository.save(ticket);

        notificationService.create(
                ticket.getCreatedByUserId(),
                NotificationType.TICKET_STATUS_CHANGED,
                "Ticket status updated",
                "Your ticket \"" + ticket.getTitle() + "\" is now " + status.name().replace('_', ' ') + ".",
                "TICKET",
                ticket.getId()
        );
        return toResponse(saved);
    }

    public TicketResponse addComment(String ticketId, String authorUserId, String content) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));
        UserAccount author = userAccountService.getById(authorUserId);

        TicketComment comment = TicketComment.builder()
                .id(UUID.randomUUID().toString())
                .authorUserId(author.getId())
                .authorName(author.getDisplayName())
                .content(content)
                .createdAt(Instant.now())
                .build();

        ticket.getComments().add(comment);
        ticket.setUpdatedAt(Instant.now());
        SupportTicket saved = supportTicketRepository.save(ticket);

        if (!ticket.getCreatedByUserId().equals(authorUserId)) {
            notificationService.create(
                    ticket.getCreatedByUserId(),
                    NotificationType.TICKET_COMMENT_ADDED,
                    "New ticket comment",
                    author.getDisplayName() + " commented on your ticket \"" + ticket.getTitle() + "\".",
                    "TICKET",
                    ticket.getId()
            );
        }

        return toResponse(saved);
    }

    private TicketResponse toResponse(SupportTicket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getCreatedByUserId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getStatus(),
                ticket.getComments().stream()
                        .map(comment -> new TicketCommentResponse(
                                comment.getId(),
                                comment.getAuthorName(),
                                comment.getContent(),
                                comment.getCreatedAt()))
                        .toList(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }
}
