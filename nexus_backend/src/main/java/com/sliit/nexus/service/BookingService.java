package com.sliit.nexus.service;

import com.sliit.nexus.model.Booking;
import com.sliit.nexus.model.BookingStatus;
import com.sliit.nexus.model.CheckInStatus;
import com.sliit.nexus.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;

    public Booking createBooking(Booking booking) {
        // Validations
        if (booking.getStartTime().isAfter(booking.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time");
        }
        if (booking.getDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot book in the past");
        }

        // Conflict Detection based on the combined resource name (e.g., "Lecture Halls - LH-01")
        // We use resourceName here because users now manually enter the specific room/ID
        List<Booking> existingBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getResourceName().equals(booking.getResourceName()) 
                        && b.getDate().equals(booking.getDate())
                        && b.getStatus() != BookingStatus.REJECTED
                        && b.getStatus() != BookingStatus.CANCELLED)
                .toList();

        for (Booking existing : existingBookings) {
            if (isOverlapping(booking.getStartTime(), booking.getEndTime(), existing.getStartTime(), existing.getEndTime())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time slot already booked for this resource");
            }
        }

        booking.setStatus(BookingStatus.PENDING);
        booking.setCheckInStatus(CheckInStatus.NOT_CHECKED_IN);
        booking.setCreatedAt(Instant.now());
        booking.setUpdatedAt(Instant.now());
        return bookingRepository.save(booking);
    }

    private boolean isOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getAvailabilityBookings() {
        return bookingRepository.findAll().stream()
                .filter(booking -> booking.getStatus() != BookingStatus.REJECTED)
                .filter(booking -> booking.getStatus() != BookingStatus.CANCELLED)
                .toList();
    }

    public List<Booking> getBookingsByUserId(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public Booking getBookingById(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        // Lazy generation for existing approved bookings missing a QR code
        if (booking.getStatus() == BookingStatus.APPROVED && (booking.getQrCode() == null || booking.getQrCode().isEmpty())) {
            generateAndSetQrCode(booking);
            return bookingRepository.save(booking);
        }
        
        return booking;
    }

    public Booking approveBooking(String id) {
        Booking booking = getBookingById(id);
        booking.setStatus(BookingStatus.APPROVED);
        generateAndSetQrCode(booking);
        booking.setUpdatedAt(Instant.now());
        return bookingRepository.save(booking);
    }

    private void generateAndSetQrCode(Booking booking) {
        try {
            String safeId = booking.getId() != null ? booking.getId() : "N/A";
            String safeRes = booking.getResourceName() != null ? booking.getResourceName() : "N/A";
            String safeDate = booking.getDate() != null ? booking.getDate().toString() : "N/A";
            String safeTime = booking.getStartTime() != null ? booking.getStartTime().toString() : "N/A";

            String qrData = String.format("ID:%s|Res:%s|Date:%s|Time:%s", safeId, safeRes, safeDate, safeTime);
            String qrBase64 = com.sliit.nexus.util.QrGenerator.generateQrCodeBase64(qrData);
            booking.setQrCode(qrBase64);
        } catch (Throwable t) {
            // Log the actual error for debugging
            System.err.println("QR Generation Error: " + t.getMessage());
            t.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "QR System Error: " + t.getClass().getSimpleName() + " - " + t.getMessage());
        }
    }

    public Booking checkIn(String id) {
        Booking booking = getBookingById(id);
        
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved bookings can be checked in");
        }
        
        if (booking.getCheckInStatus() == CheckInStatus.CHECKED_IN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Booking is already checked in");
        }
        
        booking.setCheckInStatus(CheckInStatus.CHECKED_IN);
        booking.setCheckInTime(Instant.now());
        booking.setUpdatedAt(Instant.now());
        return bookingRepository.save(booking);
    }

    public Booking rejectBooking(String id, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rejection reason is required");
        }
        Booking booking = getBookingById(id);
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        booking.setUpdatedAt(Instant.now());
        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(String id) {
        Booking booking = getBookingById(id);
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only approved bookings can be cancelled");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setUpdatedAt(Instant.now());
        return bookingRepository.save(booking);
    }

    public void deleteBooking(String id) {
        if (!bookingRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        bookingRepository.deleteById(id);
    }
}
