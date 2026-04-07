package com.sliit.nexus.controller;

import com.sliit.nexus.dto.AddCommentRequest;
import com.sliit.nexus.dto.TicketResponse;
import com.sliit.nexus.dto.UpdateTicketStatusRequest;
import com.sliit.nexus.model.AppRole;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.service.AuthService;
import com.sliit.nexus.service.TicketService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @PatchMapping("/{ticketId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','TECHNICIAN')")
    public TicketResponse updateStatus(
            @PathVariable String ticketId,
            @Valid @RequestBody UpdateTicketStatusRequest request
    ) {
        return ticketService.updateStatus(ticketId, request.status());
    }

    @PostMapping("/{ticketId}/comments")
    public TicketResponse addComment(
            @PathVariable String ticketId,
            @Valid @RequestBody AddCommentRequest request,
            Authentication authentication
    ) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        return ticketService.addComment(ticketId, currentUser.getId(), request.content());
    }
}
