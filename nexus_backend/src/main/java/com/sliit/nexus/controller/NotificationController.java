package com.sliit.nexus.controller;

import com.sliit.nexus.dto.NotificationResponse;
import com.sliit.nexus.model.UserAccount;
import com.sliit.nexus.service.AuthService;
import com.sliit.nexus.service.NotificationService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final AuthService authService;
    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> list(Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        return notificationService.listForUser(currentUser.getId());
    }

    @GetMapping("/summary")
    public Map<String, Long> summary(Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        return Map.of("unreadCount", notificationService.unreadCount(currentUser.getId()));
    }

    @PatchMapping("/read-all")
    public Map<String, String> markAllAsRead(Authentication authentication) {
        UserAccount currentUser = authService.requireCurrentUser(authentication);
        notificationService.markAllAsRead(currentUser.getId());
        return Map.of("status", "ok");
    }
}
