package com.example.backend.service;

import com.example.backend.dto.CustomerPortalActivityDTO;
import com.example.backend.dto.CustomerPortalDocumentDTO;
import com.example.backend.dto.CustomerPortalDossierDTO;
import com.example.backend.entity.*;
import com.example.backend.entity.enums.ActivityVisibility;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerPortalService {

    @Autowired private DossierRepository dossierRepository;

    @Autowired private ActivityRepository activityRepository;

    @Autowired private DocumentRepository documentRepository;

    @Autowired private ClientSecureMessageRepository messageRepository;

    @Autowired private ClientAuthTokenRepository tokenRepository;

    @Transactional(readOnly = true)
    public CustomerPortalDossierDTO getDossierForClient(Long dossierId, String orgId) {
        Dossier dossier =
                dossierRepository
                        .findById(dossierId)
                        .orElseThrow(() -> new RuntimeException("Dossier not found"));

        if (!dossier.getOrgId().equals(orgId)) {
            throw new RuntimeException("Access denied");
        }

        CustomerPortalDossierDTO dto = new CustomerPortalDossierDTO();
        dto.setId(dossier.getId());
        dto.setLeadName(dossier.getLeadName());
        dto.setLeadEmail(dossier.getLeadEmail());
        dto.setLeadPhone(dossier.getLeadPhone());
        dto.setStatusDisplay(mapDossierStatusToClientFriendly(dossier.getStatus()));
        dto.setProgressPercentage(calculateProgressPercentage(dossier.getStatus()));
        dto.setCreatedAt(dossier.getCreatedAt());
        dto.setUpdatedAt(dossier.getUpdatedAt());

        List<CustomerPortalActivityDTO> activities =
                activityRepository
                        .findByDossierIdAndVisibilityOrderByCreatedAtDesc(
                                dossierId, ActivityVisibility.CLIENT_VISIBLE)
                        .stream()
                        .map(this::mapToCustomerPortalActivityDTO)
                        .collect(Collectors.toList());
        dto.setActivities(activities);

        List<CustomerPortalDocumentDTO> documents =
                documentRepository.findByDossierId(dossierId).stream()
                        .filter(doc -> isDocumentClientVisible(doc))
                        .map(this::mapToCustomerPortalDocumentDTO)
                        .collect(Collectors.toList());
        dto.setDocuments(documents);

        long unreadCount =
                messageRepository.countByDossierIdAndFromClientAndReadAtIsNull(dossierId, false);
        dto.setUnreadMessagesCount(unreadCount);

        return dto;
    }

    private String mapDossierStatusToClientFriendly(DossierStatus status) {
        if (status == null) return "En cours";

        switch (status) {
            case NEW:
                return "Nouveau dossier";
            case QUALIFYING:
                return "Qualification en cours";
            case QUALIFIED:
                return "Dossier qualifié";
            case APPOINTMENT:
                return "Rendez-vous planifié";
            case WON:
                return "Affaire conclue";
            case LOST:
                return "Dossier clôturé";
            default:
                return "En cours";
        }
    }

    private String calculateProgressPercentage(DossierStatus status) {
        if (status == null) return "0";

        switch (status) {
            case NEW:
                return "10";
            case QUALIFYING:
                return "30";
            case QUALIFIED:
                return "50";
            case APPOINTMENT:
                return "70";
            case WON:
                return "100";
            case LOST:
                return "100";
            default:
                return "0";
        }
    }

    private CustomerPortalActivityDTO mapToCustomerPortalActivityDTO(ActivityEntity activity) {
        CustomerPortalActivityDTO dto = new CustomerPortalActivityDTO();
        dto.setId(activity.getId());
        dto.setType(activity.getType().name());
        dto.setContent(activity.getContent());
        dto.setFriendlyDescription(generateFriendlyDescription(activity));
        dto.setCreatedAt(activity.getCreatedAt());
        dto.setMetadata(activity.getMetadata());
        return dto;
    }

    private String generateFriendlyDescription(ActivityEntity activity) {
        String type = activity.getType().name();
        switch (type) {
            case "NOTE":
                return "Note ajoutée à votre dossier";
            case "EMAIL":
                return "Email envoyé";
            case "CALL":
                return "Appel téléphonique";
            case "MEETING":
                return "Rendez-vous effectué";
            case "DOCUMENT_UPLOADED":
                return "Document ajouté";
            case "STATUS_CHANGE":
                return "Statut du dossier mis à jour";
            default:
                return "Activité sur votre dossier";
        }
    }

    private boolean isDocumentClientVisible(DocumentEntity doc) {
        if (doc.getCategory() == null) {
            return false;
        }
        String category = doc.getCategory().toLowerCase();
        return category.contains("contract")
                || category.contains("contrat")
                || category.contains("photo")
                || category.contains("inspection")
                || category.contains("rapport")
                || category.contains("report")
                || category.equals("shared")
                || category.equals("client");
    }

    private CustomerPortalDocumentDTO mapToCustomerPortalDocumentDTO(DocumentEntity doc) {
        CustomerPortalDocumentDTO dto = new CustomerPortalDocumentDTO();
        dto.setId(doc.getId());
        dto.setFileName(doc.getFileName());
        dto.setFileType(doc.getFileType());
        dto.setFileSize(doc.getFileSize());
        dto.setCategory(doc.getCategory());
        dto.setCategoryDisplay(mapDocumentCategoryToClientFriendly(doc.getCategory()));
        dto.setUploadedAt(doc.getCreatedAt());
        dto.setDownloadUrl("/api/customer-portal/documents/" + doc.getId() + "/download");
        return dto;
    }

    private String mapDocumentCategoryToClientFriendly(String category) {
        if (category == null) return "Document";

        String lowerCategory = category.toLowerCase();
        if (lowerCategory.contains("contract") || lowerCategory.contains("contrat")) {
            return "Contrat";
        } else if (lowerCategory.contains("photo")) {
            return "Photos";
        } else if (lowerCategory.contains("inspection")) {
            return "Rapport d'inspection";
        } else if (lowerCategory.contains("rapport") || lowerCategory.contains("report")) {
            return "Rapport";
        } else {
            return "Document";
        }
    }

    @Transactional
    public void validateClientAccess(Long dossierId, String token) {
        LocalDateTime now = LocalDateTime.now();
        ClientAuthToken authToken =
                tokenRepository
                        .findByTokenAndExpiresAtAfter(token, now)
                        .orElseThrow(() -> new RuntimeException("Invalid or expired token"));

        if (!authToken.getDossierId().equals(dossierId)) {
            throw new RuntimeException("Token does not grant access to this dossier");
        }

        if (authToken.getUsedAt() == null) {
            authToken.setUsedAt(now);
            tokenRepository.save(authToken);
        }
    }
}
