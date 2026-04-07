package com.sliit.nexus.controller;

import com.sliit.nexus.dto.BookingResponse;
import com.sliit.nexus.dto.UpdateBookingStatusRequest;
import com.sliit.nexus.model.AppRole;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.service.AuthService;
import com.sliit.nexus.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final AuthService authService;
    private final BookingService bookingService;

    @GetMapping
    public List<BookingResponse> list(Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        boolean adminAccess = currentUser.getRoles().contains(AppRole.ADMIN) || currentUser.getRoles().contains(AppRole.MANAGER);
        return bookingService.listForUser(currentUser.getId(), adminAccess);
    }

    @PatchMapping("/{bookingId}/status")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public BookingResponse updateStatus(
            @PathVariable String bookingId,
            @Valid @RequestBody UpdateBookingStatusRequest request
    ) {
        return bookingService.updateStatus(bookingId, request.status());
    }
}
