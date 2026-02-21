package com.example.backend.service;

import com.example.backend.dto.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
public class CollaborationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final Map<Long, Set<String>> dossierViewers = new ConcurrentHashMap<>();
    private final Map<Long, Integer> dossierVersions = new ConcurrentHashMap<>();
    private final Map<String, String> userColors = new ConcurrentHashMap<>();
    private final String[] colorPalette = {
        "#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FFC300",
        "#DAF7A6", "#C70039", "#900C3F", "#581845", "#2ECC71"
    };
    private int colorIndex = 0;

    public CollaborationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void handleUserJoined(Long dossierId, String userId, String username) {
        dossierViewers.computeIfAbsent(dossierId, k -> ConcurrentHashMap.newKeySet()).add(userId);
        
        if (!userColors.containsKey(userId)) {
            userColors.put(userId, colorPalette[colorIndex % colorPalette.length]);
            colorIndex++;
        }

        CollaborationPresenceDto presence = new CollaborationPresenceDto(userId, username, dossierId, "joined");
        messagingTemplate.convertAndSend("/topic/dossier/" + dossierId + "/presence", presence);
        
        sendCurrentViewers(dossierId);
    }

    public void handleUserLeft(Long dossierId, String userId, String username) {
        Set<String> viewers = dossierViewers.get(dossierId);
        if (viewers != null) {
            viewers.remove(userId);
            if (viewers.isEmpty()) {
                dossierViewers.remove(dossierId);
            }
        }

        CollaborationPresenceDto presence = new CollaborationPresenceDto(userId, username, dossierId, "left");
        messagingTemplate.convertAndSend("/topic/dossier/" + dossierId + "/presence", presence);
        
        sendCurrentViewers(dossierId);
    }

    public void broadcastCursor(Long dossierId, String userId, String username, String fieldName, Integer cursorPosition) {
        String color = userColors.getOrDefault(userId, "#000000");
        CollaborationCursorDto cursor = new CollaborationCursorDto(userId, username, dossierId, fieldName, cursorPosition, color);
        messagingTemplate.convertAndSend("/topic/dossier/" + dossierId + "/cursor", cursor);
    }

    public CollaborationEditDto broadcastEdit(Long dossierId, String userId, String username, String fieldName, Object newValue, Object oldValue) {
        Integer currentVersion = dossierVersions.getOrDefault(dossierId, 0);
        Integer newVersion = currentVersion + 1;
        dossierVersions.put(dossierId, newVersion);

        CollaborationEditDto edit = new CollaborationEditDto(userId, username, dossierId, fieldName, newValue, oldValue, newVersion);
        messagingTemplate.convertAndSend("/topic/dossier/" + dossierId + "/edit", edit);
        
        return edit;
    }

    public void broadcastActivity(Long dossierId, String userId, String username, String activityType, String description, Object data) {
        CollaborationActivityDto activity = new CollaborationActivityDto(userId, username, dossierId, activityType, description, data);
        messagingTemplate.convertAndSend("/topic/dossier/" + dossierId + "/activity", activity);
    }

    public void shareFilterPreset(SharedFilterPresetDto filterPreset) {
        if (filterPreset.getSharedWithUserIds() != null) {
            for (String userId : filterPreset.getSharedWithUserIds()) {
                messagingTemplate.convertAndSendToUser(userId, "/queue/filter-presets", filterPreset);
            }
        } else {
            messagingTemplate.convertAndSend("/topic/filter-presets", filterPreset);
        }
    }

    public Set<String> getCurrentViewers(Long dossierId) {
        return dossierViewers.getOrDefault(dossierId, new HashSet<>());
    }

    public Integer getCurrentVersion(Long dossierId) {
        return dossierVersions.getOrDefault(dossierId, 0);
    }

    public String getUserColor(String userId) {
        return userColors.getOrDefault(userId, "#000000");
    }

    private void sendCurrentViewers(Long dossierId) {
        Set<String> viewers = getCurrentViewers(dossierId);
        messagingTemplate.convertAndSend("/topic/dossier/" + dossierId + "/viewers", viewers);
    }

    public void broadcastConflictResolution(Long dossierId, String fieldName, Object resolvedValue, String resolvedBy) {
        Map<String, Object> conflictData = Map.of(
            "fieldName", fieldName,
            "resolvedValue", resolvedValue,
            "resolvedBy", resolvedBy,
            "version", getCurrentVersion(dossierId)
        );
        messagingTemplate.convertAndSend("/topic/dossier/" + dossierId + "/conflict", conflictData);
    }
}
