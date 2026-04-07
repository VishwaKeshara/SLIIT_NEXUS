package com.sliit.nexus.dto;

import com.sliit.nexus.model.BookingStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateBookingStatusRequest(
        @NotNull BookingStatus status
) {
}
