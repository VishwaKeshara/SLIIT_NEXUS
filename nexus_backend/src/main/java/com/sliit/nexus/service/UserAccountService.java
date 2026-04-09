package com.sliit.nexus.service;

import com.sliit.nexus.dto.UserSummaryResponse;
import com.sliit.nexus.model.AppRole;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.repository.UserAccountRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccount upsertOAuthUser(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        String name = Optional.ofNullable(oauth2User.<String>getAttribute("name")).orElse(email);

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("OAuth2 provider did not return an email address.");
        }

        UserAccount account = userAccountRepository.findByEmailIgnoreCase(email)
                .orElseGet(() -> UserAccount.builder()
                        .email(email.trim().toLowerCase())
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
    }

    public UserAccount getByEmail(String email) {
        return userAccountRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    public UserAccount authenticateLocalUser(String email, String password) {
        UserAccount account = getByEmail(email);
        if (!"local".equalsIgnoreCase(account.getProvider())) {
            throw new IllegalArgumentException("This account uses " + account.getProvider() + " sign-in.");
        }
        if (account.getPasswordHash() == null || !passwordEncoder.matches(password, account.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }
        return account;
    }

    public UserAccount getById(String id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    public List<UserSummaryResponse> listUsers() {
        return userAccountRepository.findAll().stream()
                .map(this::toSummary)
                .toList();
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

        return userAccountRepository.save(account);
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
        getById(userId);
        userAccountRepository.deleteById(userId);
    }

    private UserAccount saveUpdatedAccount(
            UserAccount account,
            String displayName,
            String email,
            String password,
            Set<AppRole> roles
    ) {
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

        return userAccountRepository.save(account);
    }

    private void ensureEmailAvailable(String email, String existingUserId) {
        Optional<UserAccount> existing = userAccountRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent() && !existing.get().getId().equals(existingUserId)) {
            throw new IllegalArgumentException("An account already exists for " + email);
        }
    }

    public UserSummaryResponse updateRoles(String userId, Set<AppRole> roles) {
        UserAccount account = getById(userId);
        account.setRoles(roles);
        account.setUpdatedAt(Instant.now());
        return toSummary(userAccountRepository.save(account));
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
