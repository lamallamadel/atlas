package com.example.backend.controller;

import com.example.backend.dto.BuyerInboxResponse;
import com.example.backend.service.BuyerInboxService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDateTime;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/buyer-inbox")
@Tag(name = "Buyer inbox", description = "Relances et visites des propositions de biens")
public class BuyerInboxController {

    private final BuyerInboxService service;

    public BuyerInboxController(BuyerInboxService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(
            summary =
                    "À relancer, visites à planifier, réponses récentes, visites prévues (toutes"
                            + " annonces)")
    public BuyerInboxResponse inbox(
            @RequestParam(name = "mine", defaultValue = "false") boolean mine) {
        String agent = null;
        if (mine) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            agent = auth != null ? auth.getName() : null;
        }
        return service.inbox(agent, LocalDateTime.now());
    }
}
