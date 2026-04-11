package com.sliit.nexus.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("bookings")
public class Booking {
    @Id
    private String id;

    private String resourceId;
    private String resourceName;
    private String userId;
    private String userName; // Optional for better UI display
    
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    
    private String purpose;
    private Integer attendees;
    
    private BookingStatus status;
    private String rejectionReason;

    private String qrCode; // Base64 encoded image or token
    private CheckInStatus checkInStatus;
    private Instant checkInTime;

    private Instant createdAt;
    private Instant updatedAt;
}
