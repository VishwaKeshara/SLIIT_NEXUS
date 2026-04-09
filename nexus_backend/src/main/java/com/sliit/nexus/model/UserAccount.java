package com.sliit.nexus.model;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("users")
public class UserAccount {
    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String displayName;
    private String provider;
    private String providerId;
    private String passwordHash;

    @Builder.Default
    private Set<AppRole> roles = new HashSet<>();

    private Instant createdAt;
    private Instant updatedAt;
}
