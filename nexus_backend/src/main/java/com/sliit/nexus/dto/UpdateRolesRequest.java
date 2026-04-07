package com.sliit.nexus.dto;

import com.sliit.nexus.model.AppRole;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record UpdateRolesRequest(
        @NotEmpty Set<AppRole> roles
) {
}
