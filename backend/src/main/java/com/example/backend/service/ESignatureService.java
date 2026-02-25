package com.example.backend.service;

import com.docusign.esign.api.EnvelopesApi;
import com.docusign.esign.client.ApiClient;
import com.docusign.esign.client.ApiException;
import com.docusign.esign.model.*;
import com.example.backend.dto.SignatureRequestRequest;
import com.example.backend.entity.ContractTemplateEntity;
import com.example.backend.entity.DocumentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.SignatureRequestEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.SignatureStatus;
import com.example.backend.repository.ContractTemplateRepository;
import com.example.backend.repository.DocumentRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.SignatureRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ESignatureService {

    private static final Logger logger = LoggerFactory.getLogger(ESignatureService.class);

    private final SignatureRequestRepository signatureRequestRepository;
    private final ContractTemplateRepository contractTemplateRepository;
    private final DossierRepository dossierRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final DossierStatusTransitionService dossierStatusTransitionService;
    private final ObjectMapper objectMapper;

    @Value("${docusign.integration-key:}")
    private String docusignIntegrationKey;

    @Value("${docusign.user-id:}")
    private String docusignUserId;

    @Value("${docusign.account-id:}")
    private String docusignAccountId;

    @Value("${docusign.base-path:https://demo.docusign.net/restapi}")
    private String docusignBasePath;

    @Value("${docusign.private-key-path:}")
    private String docusignPrivateKeyPath;

    @Value("${docusign.oauth-base-path:account-d.docusign.com}")
    private String docusignOAuthBasePath;

    public ESignatureService(
            SignatureRequestRepository signatureRequestRepository,
            ContractTemplateRepository contractTemplateRepository,
            DossierRepository dossierRepository,
            DocumentRepository documentRepository,
            DocumentService documentService,
            DossierStatusTransitionService dossierStatusTransitionService,
            ObjectMapper objectMapper) {
        this.signatureRequestRepository = signatureRequestRepository;
        this.contractTemplateRepository = contractTemplateRepository;
        this.dossierRepository = dossierRepository;
        this.documentRepository = documentRepository;
        this.documentService = documentService;
        this.dossierStatusTransitionService = dossierStatusTransitionService;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SignatureRequestEntity createSignatureRequest(
            SignatureRequestRequest request, String orgId, String userId) throws Exception {

        Dossier dossier =
                dossierRepository
                        .findById(request.getDossierId())
                        .orElseThrow(() -> new IllegalArgumentException("Dossier not found"));

        SignatureRequestEntity signatureRequest = new SignatureRequestEntity();
        signatureRequest.setOrgId(orgId);
        signatureRequest.setCreatedBy(userId);
        signatureRequest.setDossierId(request.getDossierId());
        signatureRequest.setTemplateId(request.getTemplateId());
        signatureRequest.setSubject(request.getSubject());
        signatureRequest.setEmailMessage(request.getEmailMessage());
        signatureRequest.setStatus(SignatureStatus.PENDING);
        signatureRequest.setSigners(objectMapper.writeValueAsString(request.getSigners()));

        if (request.getExpirationDays() != null) {
            signatureRequest.setExpiresAt(
                    LocalDateTime.now().plusDays(request.getExpirationDays()));
        }

        signatureRequest = signatureRequestRepository.save(signatureRequest);

        return signatureRequest;
    }

    @Transactional
    public SignatureRequestEntity sendForSignature(Long signatureRequestId, String orgId)
            throws Exception {
        SignatureRequestEntity signatureRequest =
                signatureRequestRepository
                        .findByIdAndOrgId(signatureRequestId, orgId)
                        .orElseThrow(
                                () -> new IllegalArgumentException("Signature request not found"));

        if (signatureRequest.getStatus() != SignatureStatus.PENDING) {
            throw new IllegalStateException("Signature request has already been sent");
        }

        ApiClient apiClient = getDocuSignApiClient();
        EnvelopesApi envelopesApi = new EnvelopesApi(apiClient);

        EnvelopeDefinition envelope = createEnvelope(signatureRequest);

        try {
            EnvelopeSummary result = envelopesApi.createEnvelope(docusignAccountId, envelope);

            signatureRequest.setEnvelopeId(result.getEnvelopeId());
            signatureRequest.setStatus(SignatureStatus.SENT);
            signatureRequest.setSentAt(LocalDateTime.now());

            signatureRequest = signatureRequestRepository.save(signatureRequest);

            logger.info("Envelope sent successfully: {}", result.getEnvelopeId());

        } catch (ApiException e) {
            logger.error("Error sending envelope to DocuSign", e);
            throw new RuntimeException(
                    "Failed to send envelope for signature: " + e.getMessage(), e);
        }

        return signatureRequest;
    }

    private EnvelopeDefinition createEnvelope(SignatureRequestEntity signatureRequest)
            throws Exception {
        EnvelopeDefinition envelope = new EnvelopeDefinition();
        envelope.setEmailSubject(signatureRequest.getSubject());
        envelope.setEmailBlurb(signatureRequest.getEmailMessage());
        envelope.setStatus("sent");

        if (signatureRequest.getTemplateId() != null) {
            ContractTemplateEntity template =
                    contractTemplateRepository
                            .findByIdAndOrgId(
                                    signatureRequest.getTemplateId(), signatureRequest.getOrgId())
                            .orElseThrow(() -> new IllegalArgumentException("Template not found"));

            Document doc = new Document();
            doc.setDocumentBase64(getTemplateAsBase64(template));
            doc.setName(template.getFileName());
            doc.setFileExtension("pdf");
            doc.setDocumentId("1");

            envelope.setDocuments(List.of(doc));
        }

        List<SignatureRequestRequest.SignerInfo> signers =
                objectMapper.readValue(
                        signatureRequest.getSigners(),
                        objectMapper
                                .getTypeFactory()
                                .constructCollectionType(
                                        List.class, SignatureRequestRequest.SignerInfo.class));

        List<Signer> docusignSigners = new ArrayList<>();
        for (int i = 0; i < signers.size(); i++) {
            SignatureRequestRequest.SignerInfo signerInfo = signers.get(i);

            Signer signer = new Signer();
            signer.setEmail(signerInfo.getEmail());
            signer.setName(signerInfo.getName());
            signer.setRecipientId(String.valueOf(i + 1));
            signer.setRoutingOrder(String.valueOf(signerInfo.getRoutingOrder()));

            SignHere signHere = new SignHere();
            signHere.setDocumentId("1");
            signHere.setPageNumber("1");
            signHere.setRecipientId(String.valueOf(i + 1));
            signHere.setTabLabel("SignHereTab");
            signHere.setXPosition("100");
            signHere.setYPosition("100");

            Tabs tabs = new Tabs();
            tabs.setSignHereTabs(List.of(signHere));
            signer.setTabs(tabs);

            docusignSigners.add(signer);
        }

        Recipients recipients = new Recipients();
        recipients.setSigners(docusignSigners);
        envelope.setRecipients(recipients);

        return envelope;
    }

    @Transactional
    public void handleWebhookEvent(
            String envelopeId, String eventType, String orgId, String webhookPayload)
            throws Exception {
        SignatureRequestEntity signatureRequest =
                signatureRequestRepository
                        .findByEnvelopeIdAndOrgId(envelopeId, orgId)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "Signature request not found for envelope: "
                                                        + envelopeId));

        List<Object> auditTrail = new ArrayList<>();
        if (signatureRequest.getAuditTrail() != null) {
            auditTrail = objectMapper.readValue(signatureRequest.getAuditTrail(), List.class);
        }
        auditTrail.add(objectMapper.readValue(webhookPayload, Object.class));
        signatureRequest.setAuditTrail(objectMapper.writeValueAsString(auditTrail));

        switch (eventType.toLowerCase()) {
            case "envelope-sent":
                signatureRequest.setStatus(SignatureStatus.SENT);
                signatureRequest.setSentAt(LocalDateTime.now());
                break;
            case "envelope-delivered":
            case "recipient-viewing":
                signatureRequest.setStatus(SignatureStatus.VIEWED);
                signatureRequest.setViewedAt(LocalDateTime.now());
                break;
            case "recipient-signed":
                signatureRequest.setStatus(SignatureStatus.SIGNED);
                signatureRequest.setSignedAt(LocalDateTime.now());
                break;
            case "envelope-completed":
                signatureRequest.setStatus(SignatureStatus.COMPLETED);
                signatureRequest.setCompletedAt(LocalDateTime.now());
                downloadAndStoreSignedDocument(signatureRequest);
                triggerWorkflowIfNeeded(signatureRequest);
                break;
            case "envelope-declined":
                signatureRequest.setStatus(SignatureStatus.DECLINED);
                signatureRequest.setDeclinedAt(LocalDateTime.now());
                break;
            case "envelope-voided":
                signatureRequest.setStatus(SignatureStatus.VOIDED);
                signatureRequest.setVoidedAt(LocalDateTime.now());
                break;
        }

        signatureRequestRepository.save(signatureRequest);
    }

    private void downloadAndStoreSignedDocument(SignatureRequestEntity signatureRequest)
            throws Exception {
        try {
            ApiClient apiClient = getDocuSignApiClient();
            EnvelopesApi envelopesApi = new EnvelopesApi(apiClient);

            byte[] documentBytes =
                    envelopesApi.getDocument(
                            docusignAccountId, signatureRequest.getEnvelopeId(), "combined");

            String fileName =
                    "signed_contract_"
                            + signatureRequest.getId()
                            + "_"
                            + UUID.randomUUID()
                            + ".pdf";
            String storagePath = "signatures/" + signatureRequest.getOrgId() + "/" + fileName;

            DocumentEntity document = new DocumentEntity();
            document.setOrgId(signatureRequest.getOrgId());
            document.setDossierId(signatureRequest.getDossierId());
            document.setFileName(fileName);
            document.setFileType("pdf");
            document.setContentType("application/pdf");
            document.setFileSize((long) documentBytes.length);
            document.setStoragePath(storagePath);
            document.setUploadedBy(signatureRequest.getCreatedBy());
            document.setCategory("SIGNED_CONTRACT");
            document.setCreatedBy(signatureRequest.getCreatedBy());

            document = documentRepository.save(document);

            signatureRequest.setSignedDocumentId(document.getId());

            byte[] certificateBytes =
                    envelopesApi.getDocument(
                            docusignAccountId, signatureRequest.getEnvelopeId(), "certificate");

            String certificatePath =
                    "signatures/"
                            + signatureRequest.getOrgId()
                            + "/cert_"
                            + signatureRequest.getId()
                            + ".pdf";
            signatureRequest.setCertificatePath(certificatePath);

            logger.info("Signed document stored: {}", document.getId());

        } catch (ApiException e) {
            logger.error("Error downloading signed document from DocuSign", e);
            throw new RuntimeException("Failed to download signed document: " + e.getMessage(), e);
        }
    }

    private void triggerWorkflowIfNeeded(SignatureRequestEntity signatureRequest) {
        if (signatureRequest.getWorkflowTriggered()) {
            return;
        }

        try {
            Dossier dossier =
                    dossierRepository
                            .findById(signatureRequest.getDossierId())
                            .orElseThrow(() -> new IllegalArgumentException("Dossier not found"));

            DossierStatus fromStatus = dossier.getStatus();
            DossierStatus toStatus = DossierStatus.APPOINTMENT;

            if (dossierStatusTransitionService.isTransitionAllowed(fromStatus, toStatus)) {
                dossier.setStatus(toStatus);
                dossierRepository.save(dossier);

                dossierStatusTransitionService.recordTransition(
                        dossier,
                        fromStatus,
                        toStatus,
                        signatureRequest.getCreatedBy(),
                        "Signature completed, transitioning to APPOINTMENT");

                signatureRequest.setWorkflowTriggered(true);
                signatureRequestRepository.save(signatureRequest);

                logger.info("Workflow triggered for dossier: {}", dossier.getId());
            } else {
                logger.warn(
                        "Transition from {} to {} not allowed for dossier {}",
                        fromStatus,
                        toStatus,
                        dossier.getId());
            }

        } catch (Exception e) {
            logger.error(
                    "Error triggering workflow for signature request: {}",
                    signatureRequest.getId(),
                    e);
        }
    }

    public List<SignatureRequestEntity> getSignatureRequestsByDossier(
            Long dossierId, String orgId) {
        return signatureRequestRepository.findByDossierIdAndOrgId(dossierId, orgId);
    }

    public SignatureRequestEntity getSignatureRequest(Long id, String orgId) {
        return signatureRequestRepository
                .findByIdAndOrgId(id, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Signature request not found"));
    }

    private ApiClient getDocuSignApiClient() throws Exception {
        ApiClient apiClient = new ApiClient(docusignBasePath);

        if (docusignPrivateKeyPath != null && !docusignPrivateKeyPath.isEmpty()) {
            byte[] privateKeyBytes = Files.readAllBytes(Paths.get(docusignPrivateKeyPath));

            apiClient.setOAuthBasePath(docusignOAuthBasePath);

            List<String> scopes = new ArrayList<>();
            scopes.add("signature");
            scopes.add("impersonation");

            apiClient.requestJWTUserToken(
                    docusignIntegrationKey, docusignUserId, scopes, privateKeyBytes, 3600);
        }

        return apiClient;
    }

    private String getTemplateAsBase64(ContractTemplateEntity template) throws IOException {
        Path templatePath = Paths.get(template.getStoragePath());
        byte[] fileContent = Files.readAllBytes(templatePath);
        return Base64.getEncoder().encodeToString(fileContent);
    }
}
