package com.sliit.nexus.model;

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
public class BookingRequest {
    @Id
    private String id;

    private String requestedByUserId;
    private String resourceName;
    private String dateLabel;
    private BookingStatus status;
    private Instant createdAt;
    private Instant updatedAt;
}
