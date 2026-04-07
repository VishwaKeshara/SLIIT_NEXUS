package com.sliit.nexus.config;

import com.sliit.nexus.model.AppRole;
import com.sliit.nexus.model.BookingRequest;
import com.sliit.nexus.model.BookingStatus;
import com.sliit.nexus.model.SupportTicket;
import com.sliit.nexus.model.TicketStatus;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.repository.BookingRequestRepository;
import com.sliit.nexus.repository.SupportTicketRepository;
import com.sliit.nexus.repository.UserAccountRepository;
import java.time.Instant;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UserAccountRepository userAccountRepository;
    private final BookingRequestRepository bookingRequestRepository;
    private final SupportTicketRepository supportTicketRepository;

    @Bean
    ApplicationRunner seedData() {
        return args -> {
            try {
                UserAccount admin = userAccountRepository.findByEmailIgnoreCase("admin@sliitnexus.com")
                        .orElseGet(() -> userAccountRepository.save(UserAccount.builder()
                                .email("admin@sliitnexus.com")
                                .displayName("Admin User")
                                .roles(Set.of(AppRole.ADMIN, AppRole.USER))
                                .provider("seed")
                                .providerId("admin-seed")
                                .createdAt(Instant.now())
                                .updatedAt(Instant.now())
                                .build()));

                UserAccount student = userAccountRepository.findByEmailIgnoreCase("student@sliitnexus.com")
                        .orElseGet(() -> userAccountRepository.save(UserAccount.builder()
                                .email("student@sliitnexus.com")
                                .displayName("Student User")
                                .roles(Set.of(AppRole.USER))
                                .provider("seed")
                                .providerId("student-seed")
                                .createdAt(Instant.now())
                                .updatedAt(Instant.now())
                                .build()));

                if (bookingRequestRepository.count() == 0) {
                    bookingRequestRepository.save(BookingRequest.builder()
                            .requestedByUserId(student.getId())
                            .resourceName("Lecture Hall B")
                            .dateLabel("2026-04-09 10:00 AM")
                            .status(BookingStatus.PENDING)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build());
                }

                if (supportTicketRepository.count() == 0) {
                    supportTicketRepository.save(SupportTicket.builder()
                            .createdByUserId(student.getId())
                            .title("Projector not working in Lab 2")
                            .description("Projector powers on but does not show HDMI input.")
                            .status(TicketStatus.OPEN)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build());
                }
            } catch (Exception exception) {
                log.warn("Skipping Mongo seed data because the database is not reachable: {}", exception.getMessage());
            }
        };
    }
}
