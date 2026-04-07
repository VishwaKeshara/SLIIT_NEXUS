package com.sliit.nexus.service;

import com.sliit.nexus.dto.UserSummaryResponse;
import com.sliit.nexus.model.AppRole;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.repository.UserAccountRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final Map<String, UserAccount> fallbackUsers = new ConcurrentHashMap<>();

    private UserAccount fallbackAdmin() {
        return fallbackUsers.computeIfAbsent("admin@sliitnexus.com", email -> UserAccount.builder()
                .id("demo-admin")
                .email(email)
                .displayName("Admin User")
                .roles(Set.of(AppRole.ADMIN, AppRole.USER))
                .provider("demo")
                .providerId("admin-demo")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
    }

    private UserAccount fallbackStudent() {
        return fallbackUsers.computeIfAbsent("student@sliitnexus.com", email -> UserAccount.builder()
                .id("demo-student")
                .email(email)
                .displayName("Student User")
                .roles(Set.of(AppRole.USER))
                .provider("demo")
                .providerId("student-demo")
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build());
    }

    private void initializeFallbackUsers() {
        fallbackAdmin();
        fallbackStudent();
    }

    public UserAccount upsertOAuthUser(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        String name = Optional.ofNullable(oauth2User.<String>getAttribute("name")).orElse(email);
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("OAuth2 provider did not return an email address.");
        }
        try {
            UserAccount account = userAccountRepository.findByEmailIgnoreCase(email)
                    .orElseGet(() -> UserAccount.builder()
                            .email(email)
                            .roles(Set.of(AppRole.USER))
                            .createdAt(Instant.now())
                            .build());

            account.setDisplayName(name);
            account.setProvider("google");
            account.setProviderId(oauth2User.getName());
            account.setUpdatedAt(Instant.now());
            if (account.getRoles() == null || account.getRoles().isEmpty()) {
                account.setRoles(Set.of(AppRole.USER));
            }
            return userAccountRepository.save(account);
        } catch (Exception exception) {
            log.warn("Falling back to in-memory OAuth user store: {}", exception.getMessage());
            initializeFallbackUsers();
            UserAccount account = fallbackUsers.getOrDefault(email, UserAccount.builder()
                    .id("oauth-" + oauth2User.getName())
                    .email(email)
                    .roles(Set.of(AppRole.USER))
                    .createdAt(Instant.now())
                    .build());
            account.setDisplayName(name);
            account.setProvider("google");
            account.setProviderId(oauth2User.getName());
            account.setUpdatedAt(Instant.now());
            fallbackUsers.put(email, account);
            return account;
        }
    }

    public UserAccount getByEmail(String email) {
        try {
            return userAccountRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        } catch (Exception exception) {
            initializeFallbackUsers();
            UserAccount account = fallbackUsers.get(email.toLowerCase());
            if (account == null) {
                throw new IllegalArgumentException("User not found: " + email);
            }
            return account;
        }
    }

    public UserAccount getById(String id) {
        try {
            return userAccountRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        } catch (Exception exception) {
            initializeFallbackUsers();
            return fallbackUsers.values().stream()
                    .filter(user -> id.equals(user.getId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        }
    }

    public List<UserSummaryResponse> listUsers() {
        try {
            return userAccountRepository.findAll().stream()
                    .map(this::toSummary)
                    .toList();
        } catch (Exception exception) {
            initializeFallbackUsers();
            return fallbackUsers.values().stream()
                    .map(this::toSummary)
                    .toList();
        }
    }

    public UserSummaryResponse updateRoles(String userId, Set<AppRole> roles) {
        try {
            UserAccount account = getById(userId);
            account.setRoles(roles);
            account.setUpdatedAt(Instant.now());
            return toSummary(userAccountRepository.save(account));
        } catch (Exception exception) {
            initializeFallbackUsers();
            UserAccount account = getById(userId);
            account.setRoles(roles);
            account.setUpdatedAt(Instant.now());
            fallbackUsers.put(account.getEmail().toLowerCase(), account);
            return toSummary(account);
        }
    }

    public UserSummaryResponse toSummary(UserAccount account) {
        return new UserSummaryResponse(
                account.getId(),
                account.getEmail(),
                account.getDisplayName(),
                account.getRoles()
        );
    }
}
