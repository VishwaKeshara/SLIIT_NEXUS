package com.sliit.nexus.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendUrl,
        Security security
) {

    public record Security(
            boolean devLoginEnabled
    ) {
    }
}
