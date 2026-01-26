package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.CollaborationService;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.Set;

@Controller
public class CollaborationController {

    private final CollaborationService collaborationService;

    public CollaborationController(CollaborationService collaborationService) {
        this.collaborationService = collaborationService;
    }

    @MessageMapping("/dossier/{dossierId}/join")
    public void joinDossier(@DestinationVariable Long dossierId, 
                           @Payload Map<String, String> payload,
                           SimpMessageHeaderAccessor headerAccessor,
                           Principal principal) {
        String userId = payload.getOrDefault("userId", "anonymous");
        String username = payload.getOrDefault("username", "Anonymous User");
        
        collaborationService.handleUserJoined(dossierId, userId, username);
    }

    @MessageMapping("/dossier/{dossierId}/leave")
    public void leaveDossier(@DestinationVariable Long dossierId,
                            @Payload Map<String, String> payload,
                            Principal principal) {
        String userId = payload.getOrDefault("userId", "anonymous");
        String username = payload.getOrDefault("username", "Anonymous User");
        
        collaborationService.handleUserLeft(dossierId, userId, username);
    }

    @MessageMapping("/dossier/{dossierId}/cursor")
    public void updateCursor(@DestinationVariable Long dossierId,
                            @Payload CollaborationCursorDto cursor,
                            Principal principal) {
        collaborationService.broadcastCursor(dossierId, cursor.getUserId(), cursor.getUsername(), 
                                           cursor.getFieldName(), cursor.getCursorPosition());
    }

    @MessageMapping("/dossier/{dossierId}/edit")
    public void handleEdit(@DestinationVariable Long dossierId,
                          @Payload CollaborationEditDto edit,
                          Principal principal) {
        collaborationService.broadcastEdit(dossierId, edit.getUserId(), edit.getUsername(),
                                         edit.getFieldName(), edit.getNewValue(), edit.getOldValue());
    }

    @MessageMapping("/dossier/{dossierId}/activity")
    public void broadcastActivity(@DestinationVariable Long dossierId,
                                  @Payload CollaborationActivityDto activity,
                                  Principal principal) {
        collaborationService.broadcastActivity(dossierId, activity.getUserId(), activity.getUsername(),
                                             activity.getActivityType(), activity.getDescription(), activity.getData());
    }

    @MessageMapping("/filter-preset/share")
    public void shareFilterPreset(@Payload SharedFilterPresetDto filterPreset,
                                  Principal principal) {
        collaborationService.shareFilterPreset(filterPreset);
    }

    @RestController
    @RequestMapping("/api/collaboration")
    public static class CollaborationRestController {

        private final CollaborationService collaborationService;

        public CollaborationRestController(CollaborationService collaborationService) {
            this.collaborationService = collaborationService;
        }

        @GetMapping("/dossier/{dossierId}/viewers")
        public Set<String> getCurrentViewers(@PathVariable Long dossierId) {
            return collaborationService.getCurrentViewers(dossierId);
        }

        @GetMapping("/dossier/{dossierId}/version")
        public Map<String, Object> getCurrentVersion(@PathVariable Long dossierId) {
            return Map.of(
                "dossierId", dossierId,
                "version", collaborationService.getCurrentVersion(dossierId)
            );
        }

        @GetMapping("/user/{userId}/color")
        public Map<String, String> getUserColor(@PathVariable String userId) {
            return Map.of(
                "userId", userId,
                "color", collaborationService.getUserColor(userId)
            );
        }

        @PostMapping("/dossier/{dossierId}/conflict/resolve")
        public void resolveConflict(@PathVariable Long dossierId,
                                    @RequestBody Map<String, Object> conflictResolution) {
            String fieldName = (String) conflictResolution.get("fieldName");
            Object resolvedValue = conflictResolution.get("resolvedValue");
            String resolvedBy = (String) conflictResolution.get("resolvedBy");
            
            collaborationService.broadcastConflictResolution(dossierId, fieldName, resolvedValue, resolvedBy);
        }
    }
}
