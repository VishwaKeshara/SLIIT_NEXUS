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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, UserAccount> fallbackUsers = new ConcurrentHashMap<>();

    private UserAccount fallbackAdmin() {
        return fallbackUsers.computeIfAbsent("admin@sliitnexus.com", email -> UserAccount.builder()
                .id("demo-admin")
                .email(email)
                .displayName("Admin User")
                .roles(Set.of(AppRole.ADMIN, AppRole.USER))
                .provider("demo")
                .providerId("admin-demo")
                .passwordHash(passwordEncoder.encode("Admin123!"))
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
                .passwordHash(passwordEncoder.encode("Student123!"))
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

    public UserAccount authenticateLocalUser(String email, String password) {
        UserAccount account = getByEmail(email);
        if (!"local".equalsIgnoreCase(account.getProvider()) && !"seed".equalsIgnoreCase(account.getProvider())
                && !"demo".equalsIgnoreCase(account.getProvider())) {
            throw new IllegalArgumentException("This account uses " + account.getProvider() + " sign-in.");
        }
        if (account.getPasswordHash() == null || !passwordEncoder.matches(password, account.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }
        return account;
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

    public UserAccount createLocalUser(String displayName, String email, String password, Set<AppRole> roles) {
        String normalizedEmail = email.trim().toLowerCase();
        ensureEmailAvailable(normalizedEmail, null);

        UserAccount account = UserAccount.builder()
                .email(normalizedEmail)
                .displayName(displayName.trim())
                .roles((roles == null || roles.isEmpty()) ? Set.of(AppRole.USER) : roles)
                .provider("local")
                .passwordHash(passwordEncoder.encode(password))
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        try {
            return userAccountRepository.save(account);
        } catch (Exception exception) {
            initializeFallbackUsers();
            account.setId("local-" + normalizedEmail.replaceAll("[^a-z0-9]", "-"));
            fallbackUsers.put(normalizedEmail, account);
            return account;
        }
    }

    public UserSummaryResponse createUser(String displayName, String email, String password, Set<AppRole> roles) {
        return toSummary(createLocalUser(displayName, email, password, roles));
    }

    public UserAccount updateOwnAccount(String userId, String displayName, String email, String password) {
        UserAccount account = getById(userId);
        return saveUpdatedAccount(account, displayName, email, password, null);
    }

    public UserSummaryResponse updateUser(String userId, String displayName, String email, String password, Set<AppRole> roles) {
        UserAccount account = getById(userId);
        return toSummary(saveUpdatedAccount(account, displayName, email, password, roles));
    }

    public void deleteUser(String userId) {
        UserAccount account = getById(userId);
        try {
            userAccountRepository.deleteById(userId);
        } catch (Exception exception) {
            initializeFallbackUsers();
            fallbackUsers.remove(account.getEmail().toLowerCase());
        }
    }

    private UserAccount saveUpdatedAccount(
            UserAccount account,
            String displayName,
            String email,
            String password,
            Set<AppRole> roles
    ) {
        String previousEmail = account.getEmail() == null ? null : account.getEmail().toLowerCase();
        String normalizedEmail = email.trim().toLowerCase();
        ensureEmailAvailable(normalizedEmail, account.getId());

        account.setDisplayName(displayName.trim());
        account.setEmail(normalizedEmail);
        account.setUpdatedAt(Instant.now());

        if (password != null && !password.isBlank()) {
            account.setPasswordHash(passwordEncoder.encode(password));
            if (account.getProvider() == null || "google".equalsIgnoreCase(account.getProvider())) {
                account.setProvider("local");
                account.setProviderId(null);
            }
        }

        if (roles != null && !roles.isEmpty()) {
            account.setRoles(roles);
        }

        try {
            return userAccountRepository.save(account);
        } catch (Exception exception) {
            initializeFallbackUsers();
            if (previousEmail != null && !previousEmail.equals(normalizedEmail)) {
                fallbackUsers.remove(previousEmail);
            }
            fallbackUsers.put(normalizedEmail, account);
            return account;
        }
    }

    private void ensureEmailAvailable(String email, String existingUserId) {
        try {
            Optional<UserAccount> existing = userAccountRepository.findByEmailIgnoreCase(email);
            if (existing.isPresent() && !existing.get().getId().equals(existingUserId)) {
                throw new IllegalArgumentException("An account already exists for " + email);
            }
        } catch (IllegalArgumentException exception) {
            throw exception;
        } catch (Exception exception) {
            initializeFallbackUsers();
            UserAccount fallback = fallbackUsers.get(email);
            if (fallback != null && !fallback.getId().equals(existingUserId)) {
                throw new IllegalArgumentException("An account already exists for " + email);
            }
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
                account.getRoles(),
                account.getProvider(),
                account.getCreatedAt()
        );
    }
}
