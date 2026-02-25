package com.example.backend.controller;

import com.example.backend.dto.ConversationStateResponse;
import com.example.backend.dto.InboundMessageRequest;
import com.example.backend.entity.ConversationStateEntity;
import com.example.backend.repository.ConversationStateRepository;
import com.example.backend.service.ConversationStateManager;
import com.example.backend.util.TenantContext;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private static final Logger log = LoggerFactory.getLogger(ConversationController.class);

    private final ConversationStateManager conversationStateManager;
    private final ConversationStateRepository conversationStateRepository;

    public ConversationController(
            ConversationStateManager conversationStateManager,
            ConversationStateRepository conversationStateRepository) {
        this.conversationStateManager = conversationStateManager;
        this.conversationStateRepository = conversationStateRepository;
    }

    @PostMapping("/inbound")
    public ResponseEntity<Void> receiveInboundMessage(
            @Valid @RequestBody InboundMessageRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            log.error("Organization ID not found in context");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        try {
            conversationStateManager.processInboundMessage(
                    orgId,
                    request.getPhoneNumber(),
                    request.getMessageBody(),
                    request.getProviderMessageId());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error processing inbound message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/phone/{phoneNumber}")
    public ResponseEntity<ConversationStateResponse> getActiveConversation(
            @PathVariable String phoneNumber) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Optional<ConversationStateEntity> conversation =
                conversationStateRepository.findActiveConversation(
                        orgId, phoneNumber, LocalDateTime.now());

        if (conversation.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ConversationStateResponse response = mapToResponse(conversation.get());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<ConversationStateResponse> getConversationByAppointment(
            @PathVariable Long appointmentId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        Optional<ConversationStateEntity> conversation =
                conversationStateRepository.findActiveConversationByAppointment(
                        orgId, appointmentId, LocalDateTime.now());

        if (conversation.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ConversationStateResponse response = mapToResponse(conversation.get());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/initialize")
    public ResponseEntity<Void> initializeConversation(
            @RequestParam String phoneNumber,
            @RequestParam Long appointmentId,
            @RequestParam(required = false) Long dossierId) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        try {
            conversationStateManager.initializeConversation(
                    orgId, phoneNumber, appointmentId, dossierId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error initializing conversation", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private ConversationStateResponse mapToResponse(ConversationStateEntity entity) {
        ConversationStateResponse response = new ConversationStateResponse();
        response.setId(entity.getId());
        response.setPhoneNumber(entity.getPhoneNumber());
        response.setState(entity.getState());
        response.setContextData(entity.getContextData());
        response.setAppointmentId(entity.getAppointmentId());
        response.setDossierId(entity.getDossierId());
        response.setExpiresAt(entity.getExpiresAt());
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }
}
