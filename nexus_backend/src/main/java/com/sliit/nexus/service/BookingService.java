package com.sliit.nexus.service;

import com.sliit.nexus.enums.ResourceType;
import com.sliit.nexus.model.Booking;
import com.sliit.nexus.model.BookingStatus;
import com.sliit.nexus.model.CheckInStatus;
import com.sliit.nexus.model.Resource;
import com.sliit.nexus.repository.BookingRepository;
import com.sliit.nexus.repository.ResourceRepository;
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
    private final ResourceRepository resourceRepository;

    public Booking createBooking(Booking booking) {
        if (booking.getStartTime().isAfter(booking.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time");
        }
        if (booking.getDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot book in the past");
        }

        Resource resource = resourceRepository.findById(booking.getResourceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected resource was not found"));

        validateBookingAgainstResource(booking, resource);
        booking.setResourceName(resource.getName());

        List<Booking> overlappingBookings = bookingRepository.findAll().stream()
                .filter(existing -> isActiveBooking(existing.getStatus()))
                .filter(existing -> doesBookingMatchResource(existing, resource, booking))
                .filter(existing -> existing.getDate().equals(booking.getDate()))
                .filter(existing -> isOverlapping(booking.getStartTime(), booking.getEndTime(), existing.getStartTime(), existing.getEndTime()))
                .toList();

        boolean isSharedEquipment = resource.getType() == ResourceType.EQUIPMENT
                && (Boolean.TRUE.equals(resource.getSharedResource())
                || (resource.getCapacity() != null && resource.getCapacity() > 1));
        if (isSharedEquipment) {
            if (overlappingBookings.size() >= resource.getCapacity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All units are already booked for this time slot");
            }
        } else if (!overlappingBookings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time slot already booked for this resource");
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

    private void validateBookingAgainstResource(Booking booking, Resource resource) {
        if (resource.getStatus() == null || !"ACTIVE".equals(resource.getStatus().name())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This resource is currently unavailable for booking");
        }

        if (booking.getStartTime().isBefore(resource.getAvailableFrom()) || booking.getEndTime().isAfter(resource.getAvailableTo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected time is outside the resource availability window");
        }

        if (resource.getType() != ResourceType.EQUIPMENT
                && booking.getAttendees() != null
                && resource.getCapacity() != null
                && booking.getAttendees() > resource.getCapacity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attendee count exceeds the resource capacity");
        }
    }

    private boolean isActiveBooking(BookingStatus status) {
        return status != BookingStatus.REJECTED && status != BookingStatus.CANCELLED;
    }

    private boolean doesBookingMatchResource(Booking existing, Resource resource, Booking incoming) {
        if (existing.getResourceId() != null && existing.getResourceId().equals(incoming.getResourceId())) {
            return true;
        }

        return existing.getResourceName() != null
                && resource.getName() != null
                && existing.getResourceName().trim().equalsIgnoreCase(resource.getName().trim());
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
