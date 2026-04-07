package com.sliit.nexus.dto;

import com.sliit.nexus.model.AppRole;
import java.util.Set;

public record AuthResponse(
        boolean authenticated,
        String id,
        String email,
        String displayName,
        Set<AppRole> roles
) {
}
