package com.example.backend.controller;

import com.example.backend.dto.WhatsAppReplyRequest;
import com.example.backend.dto.WhatsAppReplyResponse;
import com.example.backend.service.DossierWhatsAppService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dossiers/{dossierId}/whatsapp")
@Tag(name = "WhatsApp dossier", description = "Conversation WhatsApp d'un dossier")
public class DossierWhatsAppController {

    private final DossierWhatsAppService service;

    public DossierWhatsAppController(DossierWhatsAppService service) {
        this.service = service;
    }

    @PostMapping("/reply")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("hasAnyRole('ADMIN', 'PRO')")
    @Operation(summary = "Répondre au client sur WhatsApp (fenêtre de 24 h, accord « suivi »)")
    public WhatsAppReplyResponse reply(
            @PathVariable Long dossierId, @RequestBody WhatsAppReplyRequest request) {
        return service.reply(dossierId, request == null ? null : request.message());
    }
}
