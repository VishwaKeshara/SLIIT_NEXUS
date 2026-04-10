package com.sliit.nexus.controller;

import com.sliit.nexus.dto.RejectBookingRequest;
import com.sliit.nexus.model.Booking;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.service.AuthService;
import com.sliit.nexus.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final AuthService authService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Booking createBooking(@RequestBody Booking booking, Authentication authentication) {
        UserAccount userAccount = authService.requireCurrentUser(authentication);
        booking.setUserId(userAccount.getId());
        booking.setUserName(userAccount.getDisplayName());
        return bookingService.createBooking(booking);
    }

    @GetMapping
    public List<Booking> getBookings(Authentication authentication) {
        UserAccount userAccount = authService.requireCurrentUser(authentication);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return bookingService.getAllBookings();
        } else {
            return bookingService.getBookingsByUserId(userAccount.getId());
        }
    }

    @GetMapping("/{id}")
    public Booking getBookingById(@PathVariable String id) {
        return bookingService.getBookingById(id);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public Booking approveBooking(@PathVariable String id) {
        return bookingService.approveBooking(id);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public Booking rejectBooking(@PathVariable String id, @RequestBody RejectBookingRequest request) {
        return bookingService.rejectBooking(id, request.reason());
    }

    @PutMapping("/{id}/cancel")
    public Booking cancelBooking(@PathVariable String id, Authentication authentication) {
        // Option: Check if current user is owner of booking or admin
        return bookingService.cancelBooking(id);
    }

    @GetMapping("/checkin/{id}")
    public Booking checkIn(@PathVariable String id) {
        return bookingService.checkIn(id);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBooking(@PathVariable String id) {
        bookingService.deleteBooking(id);
    }
}
