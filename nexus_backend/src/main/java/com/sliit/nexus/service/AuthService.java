package com.sliit.nexus.service;

import com.sliit.nexus.dto.AuthResponse;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.security.AppUserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountService userAccountService;

    public AuthResponse currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new AuthResponse(false, null, null, null, Set.of());
        }

        UserAccount user = resolveUser(authentication);
        return new AuthResponse(true, user.getId(), user.getEmail(), user.getDisplayName(), user.getRoles());
    }

    public AuthResponse devLogin(String email, HttpServletRequest request) {
        UserAccount user = userAccountService.getByEmail(email);
        AppUserPrincipal principal = new AppUserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRoles()
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(principal);
        SecurityContextHolder.setContext(context);
        request.getSession(true).setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                context
        );

        return new AuthResponse(true, user.getId(), user.getEmail(), user.getDisplayName(), user.getRoles());
    }

    public UserAccount requireCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return resolveUser(authentication);
    }

    private UserAccount resolveUser(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUserPrincipal appUserPrincipal) {
            return userAccountService.getById(appUserPrincipal.getUserId());
        }
        if (principal instanceof OAuth2User oauth2User) {
            return userAccountService.upsertOAuthUser(oauth2User);
        }
        return userAccountService.getByEmail(authentication.getName());
    }
}
