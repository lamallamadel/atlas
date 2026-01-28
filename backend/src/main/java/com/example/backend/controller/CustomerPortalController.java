package com.example.backend.controller;

import com.example.backend.dto.CustomerPortalDossierDTO;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.AppointmentRequestStatus;
import com.example.backend.entity.enums.ConsentementChannel;
import com.example.backend.entity.enums.ConsentementStatus;
import com.example.backend.repository.*;
import com.example.backend.service.CustomerPortalService;
import com.example.backend.service.MagicLinkAuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer-portal")
@CrossOrigin(origins = "*")
public class CustomerPortalController {

    @Autowired
    private CustomerPortalService customerPortalService;

    @Autowired
    private MagicLinkAuthService magicLinkAuthService;

    @Autowired
    private ClientSecureMessageRepository messageRepository;

    @Autowired
    private ClientAppointmentRequestRepository appointmentRequestRepository;

    @Autowired
    private ClientSatisfactionSurveyRepository surveyRepository;

    @Autowired
    private ConsentementRepository consentementRepository;

    @Autowired
    private WhiteLabelConfigRepository whiteLabelConfigRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private AnnonceRepository annonceRepository;

    @PostMapping("/auth/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("dossierId", authToken.getDossierId());
            response.put("orgId", authToken.getOrgId());
            response.put("token", token);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<CustomerPortalDossierDTO> getDossier(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        CustomerPortalDossierDTO dossier = customerPortalService.getDossierForClient(dossierId, authToken.getOrgId());
        return ResponseEntity.ok(dossier);
    }

    @GetMapping("/messages/{dossierId}")
    public ResponseEntity<List<ClientSecureMessage>> getMessages(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<ClientSecureMessage> messages = messageRepository
            .findByOrgIdAndDossierIdOrderByCreatedAtAsc(authToken.getOrgId(), dossierId);
        
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/messages/{dossierId}")
    public ResponseEntity<ClientSecureMessage> sendMessage(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        ClientSecureMessage message = new ClientSecureMessage();
        message.setOrgId(authToken.getOrgId());
        message.setDossierId(dossierId);
        message.setFromClient(true);
        message.setEncryptedContent(request.get("encryptedContent"));
        message.setInitializationVector(request.get("iv"));
        message.setSenderId("CLIENT");
        
        ClientSecureMessage saved = messageRepository.save(message);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/messages/{messageId}/read")
    public ResponseEntity<Void> markMessageAsRead(
            @PathVariable Long messageId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        ClientSecureMessage message = messageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        
        if (!message.getDossierId().equals(authToken.getDossierId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        if (message.getReadAt() == null) {
            message.setReadAt(LocalDateTime.now());
            messageRepository.save(message);
        }
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/appointments/{dossierId}")
    public ResponseEntity<List<ClientAppointmentRequest>> getAppointmentRequests(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<ClientAppointmentRequest> requests = appointmentRequestRepository
            .findByOrgIdAndDossierIdOrderByCreatedAtDesc(authToken.getOrgId(), dossierId);
        
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/appointments/{dossierId}")
    public ResponseEntity<ClientAppointmentRequest> createAppointmentRequest(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ClientAppointmentRequest request) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        request.setOrgId(authToken.getOrgId());
        request.setDossierId(dossierId);
        request.setStatus(AppointmentRequestStatus.PENDING);
        
        ClientAppointmentRequest saved = appointmentRequestRepository.save(request);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/surveys/{dossierId}")
    public ResponseEntity<List<ClientSatisfactionSurvey>> getSurveys(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<ClientSatisfactionSurvey> surveys = surveyRepository
            .findByOrgIdAndDossierIdOrderByCreatedAtDesc(authToken.getOrgId(), dossierId);
        
        return ResponseEntity.ok(surveys);
    }

    @PostMapping("/surveys/{dossierId}")
    public ResponseEntity<ClientSatisfactionSurvey> submitSurvey(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ClientSatisfactionSurvey survey) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        survey.setOrgId(authToken.getOrgId());
        survey.setDossierId(dossierId);
        survey.setCompletedAt(LocalDateTime.now());
        
        ClientSatisfactionSurvey saved = surveyRepository.save(survey);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/consents/{dossierId}")
    public ResponseEntity<List<ConsentementEntity>> getConsents(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<ConsentementEntity> consents = consentementRepository.findByDossierId(dossierId);
        return ResponseEntity.ok(consents);
    }

    @PutMapping("/consents/{consentId}")
    public ResponseEntity<ConsentementEntity> updateConsent(
            @PathVariable Long consentId,
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> request) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        ConsentementEntity consent = consentementRepository.findById(consentId)
            .orElseThrow(() -> new RuntimeException("Consent not found"));
        
        if (!consent.getDossier().getId().equals(authToken.getDossierId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        String status = request.get("status");
        if (status != null) {
            consent.setStatus(ConsentementStatus.valueOf(status));
        }
        
        ConsentementEntity saved = consentementRepository.save(consent);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/branding/{orgId}")
    public ResponseEntity<WhiteLabelConfigEntity> getBranding(@PathVariable String orgId) {
        WhiteLabelConfigEntity config = whiteLabelConfigRepository.findByOrgId(orgId)
            .orElse(null);
        
        if (config == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(config);
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable Long documentId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        DocumentEntity document = documentRepository.findById(documentId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        if (!document.getDossierId().equals(authToken.getDossierId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        byte[] data = new byte[0];
        ByteArrayResource resource = new ByteArrayResource(data);
        
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
            .body(resource);
    }

    @GetMapping("/recommendations/{dossierId}")
    public ResponseEntity<List<Annonce>> getPropertyRecommendations(
            @PathVariable Long dossierId,
            @RequestHeader("Authorization") String authHeader) {
        
        String token = extractToken(authHeader);
        ClientAuthToken authToken = magicLinkAuthService.validateToken(token);
        
        if (!authToken.getDossierId().equals(dossierId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<Annonce> recommendations = annonceRepository.findTop10ByOrgIdOrderByCreatedAtDesc(authToken.getOrgId());
        return ResponseEntity.ok(recommendations);
    }

    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        throw new RuntimeException("Invalid authorization header");
    }
}
