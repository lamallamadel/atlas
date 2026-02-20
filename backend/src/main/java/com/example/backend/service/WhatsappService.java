package com.example.backend.service;

import com.example.backend.service.AiAgentService;
import com.example.backend.dto.AiAgentRequest;
import com.example.backend.dto.AiAgentResponse;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;

import java.util.Optional;

@Service
public class WhatsappService {

    private final DossierRepository dossierRepository;
    private final AiAgentService aiAgentService;
    private final RestTemplate restTemplate;

    @Value("${twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${twilio.whatsapp-number:}")
    private String twilioWhatsappNumber; // e.g. "whatsapp:+14155238886"

    public WhatsappService(DossierRepository dossierRepository, AiAgentService aiAgentService,
            RestTemplate restTemplate) {
        this.dossierRepository = dossierRepository;
        this.aiAgentService = aiAgentService;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public void processIncomingMessage(String from, String to, String body) {
        String phoneExtracted = from.replace("whatsapp:", "");

        // 1. Find or create dossier based on the phone number
        Dossier dossier = getOrCreateDossier(phoneExtracted);

        // 2. Call the Brain Agent Service for intent interpretation & response
        // generation
        AiAgentRequest agentRequest = new AiAgentRequest();
        agentRequest.setQuery(body);
        if (dossier != null) {
            agentRequest.setConversationId("whatsapp_" + dossier.getId());
        }

        try {
            AiAgentResponse response = aiAgentService.process(agentRequest);

            // 3. Send the AI response back to the user via Twilio API
            if (response != null && response.getAnswer() != null && !response.getAnswer().isEmpty()) {
                sendWhatsappMessage(from, response.getAnswer());

                // If the agent determined a tool was called successfully (e.g. Schedule
                // Appointment),
                // we could also read `response.getActions()` and execute Spring Boot logic
                // here.
            }
        } catch (Exception e) {
            System.err.println("Error processing WhatsApp message via Brain: " + e.getMessage());
            // Fallback gracefully
            sendWhatsappMessage(from,
                    "Désolé, je rencontre des difficultés techniques. Un conseiller va prendre le relais sous peu.");
        }
    }

    private Dossier getOrCreateDossier(String phone) {
        // Look up by phone
        Dossier dossier = dossierRepository.findByLeadPhone(phone).stream().findFirst().orElse(null);

        if (dossier == null) {
            // Create a new prospect (Lead) since we don't know them
            dossier = new Dossier();
            dossier.setLeadPhone(phone);
            dossier.setSource(DossierSource.SOCIAL_MEDIA);
            dossier.setStatus(DossierStatus.NEW);
            dossier.setScore(10); // initial hotness
            dossier.setNotes("Source: WhatsApp Inbound Campaign");

            dossier = dossierRepository.save(dossier);
        }

        return dossier;
    }

    public void sendWhatsappMessage(String to, String messageBody) {
        if (twilioAccountSid == null || twilioAccountSid.isEmpty() || twilioAuthToken == null
                || twilioAuthToken.isEmpty()) {
            System.out.println("TWILIO SECRETS MISSING! Simulating WhatsApp message to " + to + ": " + messageBody);
            return;
        }

        String url = "https://api.twilio.com/2010-04-01/Accounts/" + twilioAccountSid + "/Messages.json";

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
