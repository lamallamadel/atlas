package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.SmartSuggestionsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/smart-suggestions")
@Tag(name = "Smart Suggestions", description = "Intelligent suggestions and contextual recommendations")
public class SmartSuggestionsController {

    private final SmartSuggestionsService smartSuggestionsService;

    public SmartSuggestionsController(SmartSuggestionsService smartSuggestionsService) {
        this.smartSuggestionsService = smartSuggestionsService;
    }

    @GetMapping("/dossier/{dossierId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get smart suggestions for a dossier", 
               description = "Returns contextual next-best-action suggestions based on dossier status, activity, and user behavior")
    public ResponseEntity<List<SmartSuggestionResponse>> getSuggestionsForDossier(
            @Parameter(description = "Dossier ID", required = true)
            @PathVariable Long dossierId) {
        List<SmartSuggestionResponse> suggestions = smartSuggestionsService.getSuggestionsForDossier(dossierId);
        return ResponseEntity.ok(suggestions);
    }

    @PostMapping("/track-behavior")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Track user behavior", 
               description = "Records user actions to improve future suggestions through machine learning")
    public ResponseEntity<Void> trackBehavior(@Valid @RequestBody TrackBehaviorRequest request) {
        smartSuggestionsService.trackBehavior(
                request.getActionType(), 
                request.getContextType(), 
                request.getContextId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/feedback")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Submit suggestion feedback", 
               description = "Records whether a suggestion was accepted or rejected to improve ML model")
    public ResponseEntity<Void> submitFeedback(@Valid @RequestBody SuggestionFeedbackRequest request) {
        smartSuggestionsService.submitFeedback(
                request.getSuggestionType(),
                request.getContextType(),
                request.getContextId(),
                request.getWasAccepted(),
                request.getFeedbackText());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/message-templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get message templates", 
               description = "Returns pre-filled message templates filtered by category or channel")
    public ResponseEntity<List<MessageTemplateResponse>> getMessageTemplates(
            @Parameter(description = "Template category (FOLLOW_UP, APPOINTMENT, etc.)")
            @RequestParam(required = false) String category,
            @Parameter(description = "Communication channel (EMAIL, SMS, etc.)")
            @RequestParam(required = false) String channel) {
        List<MessageTemplateResponse> templates = smartSuggestionsService.getMessageTemplates(category, channel);
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/message-templates/{templateId}/prefill")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Get prefilled message", 
               description = "Returns a message template with variables filled from dossier context")
    public ResponseEntity<PrefilledMessageResponse> getPrefilledMessage(
            @Parameter(description = "Template ID", required = true)
            @PathVariable Long templateId,
            @Parameter(description = "Dossier ID for context", required = true)
            @RequestParam Long dossierId) {
        PrefilledMessageResponse message = smartSuggestionsService.getPrefilledMessage(templateId, dossierId);
        return ResponseEntity.ok(message);
    }

    @PostMapping("/message-templates/{templateId}/use")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Record template usage", 
               description = "Increments usage counter when a template is used")
    public ResponseEntity<Void> recordTemplateUsage(
            @Parameter(description = "Template ID", required = true)
            @PathVariable Long templateId) {
        smartSuggestionsService.recordTemplateUsage(templateId);
        return ResponseEntity.ok().build();
    }
}
