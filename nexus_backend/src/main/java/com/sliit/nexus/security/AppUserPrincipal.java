package com.sliit.nexus.security;

import com.sliit.nexus.model.AppRole;
import java.security.Principal;
import java.util.Collection;
import java.util.Set;
import lombok.Getter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Getter
public class AppUserPrincipal extends AbstractAuthenticationToken implements Principal {
    private final String userId;
    private final String email;
    private final String displayName;
    private final Set<AppRole> roles;

    public AppUserPrincipal(String userId, String email, String displayName, Set<AppRole> roles) {
        super(toAuthorities(roles));
        this.userId = userId;
        this.email = email;
        this.displayName = displayName;
        this.roles = roles;
        setAuthenticated(true);
    }

    private static Collection<? extends GrantedAuthority> toAuthorities(Set<AppRole> roles) {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name()))
                .toList();
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public Object getPrincipal() {
        return this;
    }

    @Override
    public String getName() {
        return email;
    }
}
