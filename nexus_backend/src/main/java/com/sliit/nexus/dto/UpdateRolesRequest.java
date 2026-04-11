package com.sliit.nexus.dto;

import com.sliit.nexus.model.AppRole;
import com.sliit.nexus.validation.ValidAppRole;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public record UpdateRolesRequest(
        @NotEmpty @ValidAppRole Set<AppRole> roles
) {
}
