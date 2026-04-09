package com.sliit.nexus.dto;

import com.sliit.nexus.model.AppRole;
import java.time.Instant;
import java.util.Set;

public record UserSummaryResponse(
        String id,
        String email,
        String displayName,
        Set<AppRole> roles,
        String provider,
        Instant createdAt
) {
}
