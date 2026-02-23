package com.example.backend.controller;

import com.example.backend.dto.AiAgentRequest;
import com.example.backend.dto.AiAgentResponse;
import com.example.backend.service.AiAgentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/agent")
@PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
public class AiAgentController {

    private final AiAgentService aiAgentService;

    public AiAgentController(AiAgentService aiAgentService) {
        this.aiAgentService = aiAgentService;
    }

    @PostMapping
    public ResponseEntity<AiAgentResponse> process(@Valid @RequestBody AiAgentRequest request) {
        return ResponseEntity.ok(aiAgentService.process(request));
    }
}
