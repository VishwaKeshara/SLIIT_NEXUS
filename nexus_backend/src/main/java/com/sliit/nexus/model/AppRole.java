package com.sliit.nexus.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum AppRole {
    USER,
    ADMIN,
    TECHNICIAN,
    MANAGER;

    @JsonCreator
    public static AppRole fromJson(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        String normalizedValue = value.trim().toUpperCase().replaceFirst("^ROLE_", "");
        return AppRole.valueOf(normalizedValue);
    }
}
