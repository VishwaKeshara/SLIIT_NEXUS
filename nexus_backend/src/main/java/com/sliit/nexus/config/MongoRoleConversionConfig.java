package com.sliit.nexus.config;

import com.sliit.nexus.model.AppRole;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

@Configuration
public class MongoRoleConversionConfig {

    @Bean
    MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
                new AppRoleReadConverter(),
                new AppRoleWriteConverter()
        ));
    }

    @ReadingConverter
    static class AppRoleReadConverter implements Converter<String, AppRole> {

        @Override
        public AppRole convert(String source) {
            if (source == null || source.trim().isEmpty()) {
                return AppRole.USER;
            }

            try {
                String normalizedRole = source.trim().toUpperCase().replaceFirst("^ROLE_", "");
                return AppRole.valueOf(normalizedRole);
            } catch (IllegalArgumentException exception) {
                return AppRole.USER;
            }
        }
    }

    @WritingConverter
    static class AppRoleWriteConverter implements Converter<AppRole, String> {

        @Override
        public String convert(AppRole source) {
            return source.name();
        }
    }
}
