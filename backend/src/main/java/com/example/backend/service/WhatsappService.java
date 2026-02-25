package com.example.backend.service;

import com.example.backend.dto.AiAgentRequest;
import com.example.backend.dto.AiAgentResponse;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class WhatsappService {

    private final DossierRepository dossierRepository;
    private final AnnonceRepository annonceRepository;
    private final AiAgentService aiAgentService;
    private final RestTemplate restTemplate;

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.whatsapp-number:}")
    private String twilioWhatsappNumber; // e.g. "whatsapp:+14155238886"

    public WhatsappService(
            DossierRepository dossierRepository,
            AnnonceRepository annonceRepository,
            AiAgentService aiAgentService,
            RestTemplate restTemplate) {
        this.dossierRepository = dossierRepository;
        this.annonceRepository = annonceRepository;
        this.aiAgentService = aiAgentService;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public void processIncomingMessage(String from, String to, String body) {
        String phoneExtracted = from.replace("whatsapp:", "");

        // Find existing dossier to fetch Context before AI analysis
        Dossier existingDossier =
                dossierRepository.findByLeadPhone(phoneExtracted).stream().findFirst().orElse(null);
        String contextStr = null;

        if (existingDossier != null && existingDossier.getAnnonceId() != null) {
            Annonce annonce =
                    annonceRepository.findById(existingDossier.getAnnonceId()).orElse(null);
            if (annonce != null) {
                // Formatting Context string based on entity metadata
                contextStr =
                        String.format(
                                "CONTEXTE ANNONCE - Titre: %s | Prix: %s %s | Surface: %s m2 | Adresse: %s | Description: %s",
                                annonce.getTitle() != null ? annonce.getTitle() : "Inconnu",
                                annonce.getPrice() != null ? annonce.getPrice() : "Sur demande",
                                annonce.getCurrency() != null ? annonce.getCurrency() : "",
                                annonce.getSurface() != null ? annonce.getSurface() : "N/A",
                                annonce.getAddress() != null ? annonce.getAddress() : "N/A",
                                annonce.getDescription() != null
                                        ? annonce.getDescription()
                                        : "Aucune");
            }
        }

        // 1. Call the Brain Agent Service FIRST to extract intent and parameters,
        // providing context if any
        AiAgentRequest agentRequest = new AiAgentRequest();
        agentRequest.setQuery(body);
        agentRequest.setConversationId("whatsapp_" + phoneExtracted);
        if (contextStr != null) {
            agentRequest.setContext(contextStr);
        }

        AiAgentResponse response = null;
        try {
            response = aiAgentService.process(agentRequest);
        } catch (Exception e) {
            System.err.println("Error processing WhatsApp message via Brain: " + e.getMessage());
            sendWhatsappMessage(
                    from,
                    "Désolé, je rencontre des difficultés techniques. Un conseiller va prendre le relais sous peu.");
            return;
        }

        // 2. Extract orgId and annonceId from intent if available
        String orgId = "agency_a_tenant"; // Default for MVP B2B Launch if not found
        Long extractedAnnonceId = null;

        if (response != null
                && response.getIntent() != null
                && response.getIntent().getParams() != null) {
            Object idObj = response.getIntent().getParams().get("annonce_id");
            if (idObj != null) {
                try {
                    extractedAnnonceId = Long.parseLong(idObj.toString());
                    Annonce annonce = annonceRepository.findById(extractedAnnonceId).orElse(null);
                    if (annonce != null) {
                        orgId = annonce.getOrgId();
                    }
                } catch (Exception e) {
                    System.err.println("Failed to parse annonce_id: " + idObj);
                }
            }
        }

        // 3. Find or create dossier based on the phone number and correct orgId
        Dossier dossier = getOrCreateDossier(phoneExtracted, orgId, extractedAnnonceId);

        // 4. Send the AI response back to the user via Twilio API
        if (response != null && response.getAnswer() != null && !response.getAnswer().isEmpty()) {
            sendWhatsappMessage(from, response.getAnswer());
        }
    }

    private Dossier getOrCreateDossier(String phone, String orgId, Long annonceId) {
        // Look up by phone and orgId (since the same prospect could contact multiple
        // agencies)
        Dossier dossier =
                dossierRepository.findByLeadPhone(phone).stream()
                        .filter(d -> orgId.equals(d.getOrgId()))
                        .findFirst()
                        .orElse(null);

        if (dossier == null) {
            // Create a new prospect (Lead) since we don't know them in this agency
            dossier = new Dossier();
            dossier.setOrgId(orgId);
            dossier.setLeadPhone(phone);
            dossier.setSource(DossierSource.SOCIAL_MEDIA);
            dossier.setStatus(DossierStatus.NEW);
            dossier.setScore(10); // initial hotness
            dossier.setNotes("Source: WhatsApp Inbound Campaign");

            if (annonceId != null) {
                dossier.setAnnonceId(annonceId);
            }

            dossier = dossierRepository.save(dossier);
        } else if (dossier.getAnnonceId() == null && annonceId != null) {
            dossier.setAnnonceId(annonceId);
            dossier = dossierRepository.save(dossier);
        }

        return dossier;
    }

    public void sendWhatsappMessage(String to, String messageBody) {
        if (twilioAccountSid == null
                || twilioAccountSid.isEmpty()
                || twilioAuthToken == null
                || twilioAuthToken.isEmpty()) {
            System.out.println(
                    "TWILIO SECRETS MISSING! Simulating WhatsApp message to "
                            + to
                            + ": "
                            + messageBody);
            return;
        }

        String url =
                "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.setBasicAuth(twilioAccountSid, twilioAuthToken);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("To", to);
        map.add("From", twilioWhatsappNumber);
        map.add("Body", messageBody);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

        try {
            restTemplate.postForEntity(url, request, String.class);
            System.out.println("WhatsApp message successfully sent to " + to);
        } catch (Exception e) {
            System.err.println("Failed to send WhatsApp message via Twilio: " + e.getMessage());
        }
    }
}
