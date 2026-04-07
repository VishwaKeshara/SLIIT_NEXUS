package com.sliit.nexus.service;

import com.sliit.nexus.dto.NotificationResponse;
import com.sliit.nexus.model.Notification;
import com.sliit.nexus.model.NotificationType;
import com.sliit.nexus.repository.NotificationRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final Map<String, List<Notification>> fallbackNotifications = new ConcurrentHashMap<>();

    public NotificationResponse create(
            String userId,
            NotificationType type,
            String title,
            String message,
            String entityType,
            String entityId
    ) {
        Notification draft = Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .entityType(entityType)
                .entityId(entityId)
                .read(false)
                .createdAt(Instant.now())
                .build();

        try {
            return toResponse(notificationRepository.save(draft));
        } catch (Exception exception) {
            log.warn("Falling back to in-memory notifications: {}", exception.getMessage());
            fallbackNotifications.computeIfAbsent(userId, key -> new java.util.concurrent.CopyOnWriteArrayList<>()).add(0, draft);
            return toResponse(draft);
        }
    }

    public List<NotificationResponse> listForUser(String userId) {
        try {
            return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                    .map(this::toResponse)
                    .toList();
        } catch (Exception exception) {
            return fallbackNotifications.getOrDefault(userId, List.of()).stream()
                    .map(this::toResponse)
                    .toList();
        }
    }

    public long unreadCount(String userId) {
        try {
            return notificationRepository.countByUserIdAndReadFalse(userId);
        } catch (Exception exception) {
            return fallbackNotifications.getOrDefault(userId, List.of()).stream()
                    .filter(notification -> !notification.isRead())
                    .count();
        }
    }

    public void markAllAsRead(String userId) {
        try {
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            boolean changed = false;
            for (Notification notification : notifications) {
                if (!notification.isRead()) {
                    notification.setRead(true);
                    changed = true;
                }
            }
            if (changed) {
                notificationRepository.saveAll(notifications);
            }
        } catch (Exception exception) {
            fallbackNotifications.getOrDefault(userId, List.of())
                    .forEach(notification -> notification.setRead(true));
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getEntityType(),
                notification.getEntityId(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
