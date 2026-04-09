package com.sliit.nexus.service;

import com.sliit.nexus.dto.CreateTicketRequest;
import com.sliit.nexus.dto.TicketCommentResponse;
import com.sliit.nexus.dto.TicketResponse;
import com.sliit.nexus.model.NotificationType;
import com.sliit.nexus.model.SupportTicket;
import com.sliit.nexus.model.TicketComment;
import com.sliit.nexus.model.TicketStatus;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.repository.SupportTicketRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class TicketService {

    private static final int MAX_ATTACHMENTS = 3;
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    private final SupportTicketRepository supportTicketRepository;
    private final NotificationService notificationService;
    private final UserAccountService userAccountService;

    @Value("${app.attachments.upload-dir:uploads/tickets}")
    private String uploadDir;

    public List<TicketResponse> listForUser(String userId, boolean elevatedAccess) {
        List<SupportTicket> tickets = elevatedAccess
                ? supportTicketRepository.findAllByOrderByCreatedAtDesc()
                : supportTicketRepository.findByCreatedByUserIdOrderByCreatedAtDesc(userId);
        return tickets.stream().map(this::toResponse).toList();
    }

    public TicketResponse create(CreateTicketRequest request, String userId) {
        SupportTicket ticket = SupportTicket.builder()
                .id(UUID.randomUUID().toString())
                .createdByUserId(userId)
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .priority(request.priority())
                .resourceId(request.resourceId())
                .location(request.location())
                .preferredContact(request.preferredContact())
                .status(TicketStatus.OPEN)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        return toResponse(supportTicketRepository.save(ticket));
    }

    public TicketResponse getById(String ticketId, String requestingUserId, boolean elevatedAccess) {
        SupportTicket ticket = findTicket(ticketId);
        if (!elevatedAccess && !ticket.getCreatedByUserId().equals(requestingUserId)) {
            throw new SecurityException("Access denied");
        }
        return toResponse(ticket);
    }

    public void delete(String ticketId, String requestingUserId, boolean isAdmin) {
        SupportTicket ticket = findTicket(ticketId);
        if (!isAdmin && !ticket.getCreatedByUserId().equals(requestingUserId)) {
            throw new SecurityException("Access denied");
        }
        // Clean up stored attachment files
        ticket.getImageAttachments().forEach(filename -> deleteFile(ticketId, filename));
        supportTicketRepository.delete(ticket);
    }

    public TicketResponse updateStatus(String ticketId, TicketStatus status, String rejectionReason, String resolutionNotes) {
        SupportTicket ticket = findTicket(ticketId);

        ticket.setStatus(status);
        if (rejectionReason != null && !rejectionReason.isBlank()) {
            ticket.setRejectionReason(rejectionReason);
        }
        if (resolutionNotes != null && !resolutionNotes.isBlank()) {
            ticket.setResolutionNotes(resolutionNotes);
        }
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

    public TicketResponse assign(String ticketId, String assignedToUserId) {
        SupportTicket ticket = findTicket(ticketId);
        ticket.setAssignedToUserId(assignedToUserId);
        ticket.setUpdatedAt(Instant.now());
        return toResponse(supportTicketRepository.save(ticket));
    }

    public TicketResponse addComment(String ticketId, String authorUserId, String content) {
        SupportTicket ticket = findTicket(ticketId);
        UserAccount author = userAccountService.getById(authorUserId);

        TicketComment comment = TicketComment.builder()
                .id(UUID.randomUUID().toString())
                .authorUserId(author.getId())
                .authorName(author.getDisplayName())
                .content(content)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
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

    public TicketResponse editComment(String ticketId, String commentId, String requestingUserId, String newContent) {
        SupportTicket ticket = findTicket(ticketId);
        TicketComment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        if (!comment.getAuthorUserId().equals(requestingUserId)) {
            throw new SecurityException("Cannot edit another user's comment");
        }
        comment.setContent(newContent);
        comment.setUpdatedAt(Instant.now());
        ticket.setUpdatedAt(Instant.now());
        return toResponse(supportTicketRepository.save(ticket));
    }

    public void deleteComment(String ticketId, String commentId, String requestingUserId, boolean isAdmin) {
        SupportTicket ticket = findTicket(ticketId);
        TicketComment comment = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));

        if (!isAdmin && !comment.getAuthorUserId().equals(requestingUserId)) {
            throw new SecurityException("Cannot delete another user's comment");
        }
        ticket.getComments().removeIf(c -> c.getId().equals(commentId));
        ticket.setUpdatedAt(Instant.now());
        supportTicketRepository.save(ticket);
    }

    public TicketResponse addAttachment(String ticketId, String requestingUserId, MultipartFile file) {
        SupportTicket ticket = findTicket(ticketId);

        if (!ticket.getCreatedByUserId().equals(requestingUserId)) {
            throw new SecurityException("Only the ticket creator can add attachments");
        }
        if (ticket.getImageAttachments().size() >= MAX_ATTACHMENTS) {
            throw new IllegalStateException("Maximum of " + MAX_ATTACHMENTS + " attachments allowed per ticket");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, GIF, and WebP images are allowed");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : ".jpg";
        String storedFilename = UUID.randomUUID() + extension;

        Path dir = Paths.get(uploadDir, ticketId);
        try {
            Files.createDirectories(dir);
            file.transferTo(dir.resolve(storedFilename));
        } catch (IOException e) {
            throw new RuntimeException("Failed to store attachment: " + e.getMessage(), e);
        }

        ticket.getImageAttachments().add(storedFilename);
        ticket.setUpdatedAt(Instant.now());
        return toResponse(supportTicketRepository.save(ticket));
    }

    public ResponseEntity<byte[]> getAttachment(String ticketId, String filename) {
        String safeFilename = Paths.get(filename).getFileName().toString();
        Path filePath = Paths.get(uploadDir, ticketId, safeFilename);
        try {
            byte[] data = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            return ResponseEntity.ok()
                    .contentType(contentType != null ? MediaType.parseMediaType(contentType) : MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + safeFilename + "\"")
                    .body(data);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    public void deleteAttachment(String ticketId, String filename, String requestingUserId, boolean isAdmin) {
        SupportTicket ticket = findTicket(ticketId);
        if (!isAdmin && !ticket.getCreatedByUserId().equals(requestingUserId)) {
            throw new SecurityException("Access denied");
        }
        String safeFilename = Paths.get(filename).getFileName().toString();
        if (!ticket.getImageAttachments().contains(safeFilename)) {
            throw new IllegalArgumentException("Attachment not found: " + safeFilename);
        }
        deleteFile(ticketId, safeFilename);
        ticket.getImageAttachments().remove(safeFilename);
        ticket.setUpdatedAt(Instant.now());
        supportTicketRepository.save(ticket);
    }

    private void deleteFile(String ticketId, String filename) {
        try {
            Files.deleteIfExists(Paths.get(uploadDir, ticketId, filename));
        } catch (IOException ignored) {
        }
    }

    private SupportTicket findTicket(String ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + ticketId));
    }

    private TicketResponse toResponse(SupportTicket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getCreatedByUserId(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getLocation(),
                ticket.getResourceId(),
                ticket.getPreferredContact(),
                ticket.getStatus(),
                ticket.getAssignedToUserId(),
                ticket.getResolutionNotes(),
                ticket.getRejectionReason(),
                ticket.getImageAttachments(),
                ticket.getComments().stream()
                        .map(comment -> new TicketCommentResponse(
                                comment.getId(),
                                comment.getAuthorUserId(),
                                comment.getAuthorName(),
                                comment.getContent(),
                                comment.getCreatedAt(),
                                comment.getUpdatedAt()))
                        .toList(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt()
        );
    }
}
