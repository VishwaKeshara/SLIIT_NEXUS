package com.sliit.nexus.service;

import com.sliit.nexus.dto.BookingResponse;
import com.sliit.nexus.model.BookingRequest;
import com.sliit.nexus.model.BookingStatus;
import com.sliit.nexus.model.NotificationType;
import com.sliit.nexus.repository.BookingRequestRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRequestRepository bookingRequestRepository;
    private final NotificationService notificationService;

    public List<BookingResponse> listForUser(String userId, boolean adminAccess) {
        List<BookingRequest> bookings = adminAccess
                ? bookingRequestRepository.findAll()
                : bookingRequestRepository.findByRequestedByUserIdOrderByCreatedAtDesc(userId);
        return bookings.stream().map(this::toResponse).toList();
    }

    public BookingResponse updateStatus(String bookingId, BookingStatus status) {
        BookingRequest booking = bookingRequestRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        booking.setStatus(status);
        booking.setUpdatedAt(Instant.now());
        BookingRequest saved = bookingRequestRepository.save(booking);

        NotificationType type = status == BookingStatus.APPROVED
                ? NotificationType.BOOKING_APPROVED
                : NotificationType.BOOKING_REJECTED;
        notificationService.create(
                booking.getRequestedByUserId(),
                type,
                "Booking " + status.name().toLowerCase(),
                "Your booking for " + booking.getResourceName() + " was " + status.name().toLowerCase() + ".",
                "BOOKING",
                booking.getId()
        );
        return toResponse(saved);
    }

    private BookingResponse toResponse(BookingRequest booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getRequestedByUserId(),
                booking.getResourceName(),
                booking.getDateLabel(),
                booking.getStatus(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
