package com.sliit.nexus.controller;

import com.sliit.nexus.dto.AddCommentRequest;
import com.sliit.nexus.dto.AssignTicketRequest;
import com.sliit.nexus.dto.CreateTicketRequest;
import com.sliit.nexus.dto.EditCommentRequest;
import com.sliit.nexus.dto.TicketResponse;
import com.sliit.nexus.dto.UpdateTicketStatusRequest;
import com.sliit.nexus.model.AppRole;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.service.AuthService;
import com.sliit.nexus.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final AuthService authService;
    private final TicketService ticketService;

    @GetMapping
    public List<TicketResponse> list(Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        boolean elevatedAccess = currentUser.getRoles().contains(AppRole.ADMIN)
                || currentUser.getRoles().contains(AppRole.MANAGER)
                || currentUser.getRoles().contains(AppRole.TECHNICIAN);
        return ticketService.listForUser(currentUser.getId(), elevatedAccess);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse create(
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        return ticketService.create(request, currentUser.getId());
    }

    @GetMapping("/{ticketId}")
    public TicketResponse getById(
            @PathVariable String ticketId,
            Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        boolean elevatedAccess = currentUser.getRoles().contains(AppRole.ADMIN)
                || currentUser.getRoles().contains(AppRole.MANAGER)
                || currentUser.getRoles().contains(AppRole.TECHNICIAN);
        return ticketService.getById(ticketId, currentUser.getId(), elevatedAccess);
    }

    @DeleteMapping("/{ticketId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable String ticketId,
            Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        boolean isAdmin = currentUser.getRoles().contains(AppRole.ADMIN);
        ticketService.delete(ticketId, currentUser.getId(), isAdmin);
    }

    @PatchMapping("/{ticketId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','TECHNICIAN')")
    public TicketResponse updateStatus(
            @PathVariable String ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request) {
        return ticketService.updateStatus(ticketId, request.status(), request.rejectionReason(),
                request.resolutionNotes());
    }

    @PatchMapping("/{ticketId}/assign")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public TicketResponse assign(
            @PathVariable String ticketId,
            @Valid @RequestBody AssignTicketRequest request) {
        return ticketService.assign(ticketId, request.assignedToUserId());
    }

    @PostMapping("/{ticketId}/comments")
    public TicketResponse addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody AddCommentRequest request,
            Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        return ticketService.addComment(ticketId, currentUser.getId(), request.content());
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public TicketResponse editComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            @Valid @RequestBody EditCommentRequest request,
            Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        return ticketService.editComment(ticketId, commentId, currentUser.getId(), request.content());
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable String ticketId,
            @PathVariable String commentId,
            Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        boolean isAdmin = currentUser.getRoles().contains(AppRole.ADMIN);
        ticketService.deleteComment(ticketId, commentId, currentUser.getId(), isAdmin);
    }

    @PostMapping(value = "/{ticketId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TicketResponse uploadAttachment(
            @PathVariable String ticketId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        return ticketService.addAttachment(ticketId, currentUser.getId(), file);
    }

    @GetMapping("/{ticketId}/attachments/{filename}")
    public ResponseEntity<byte[]> getAttachment(
            @PathVariable String ticketId,
            @PathVariable String filename,
            Authentication authentication) {
        authService.requireCurrentUser(authentication);
        return ticketService.getAttachment(ticketId, filename);
    }

    @DeleteMapping("/{ticketId}/attachments/{filename}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(
            @PathVariable String ticketId,
            @PathVariable String filename,
            Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        boolean isAdmin = currentUser.getRoles().contains(AppRole.ADMIN);
        ticketService.deleteAttachment(ticketId, filename, currentUser.getId(), isAdmin);
    }
}
