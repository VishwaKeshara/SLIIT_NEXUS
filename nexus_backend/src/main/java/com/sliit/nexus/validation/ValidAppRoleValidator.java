package com.sliit.nexus.validation;

import com.sliit.nexus.model.AppRole;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.Set;

public class ValidAppRoleValidator implements ConstraintValidator<ValidAppRole, Set<AppRole>> {

    @Override
    public boolean isValid(Set<AppRole> roles, ConstraintValidatorContext context) {
        if (roles == null || roles.isEmpty()) {
            return false;
        }

        for (AppRole role : roles) {
            if (role == null || !isValidRole(role)) {
                return false;
            }
        }

        return true;
    }

    private boolean isValidRole(AppRole role) {
        try {
            AppRole.valueOf(role.name());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}