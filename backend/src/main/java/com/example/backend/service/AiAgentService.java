package com.example.backend.service;

import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.dto.AgentBrainRequest;
import com.example.backend.brain.dto.AgentBrainResponse;
import com.example.backend.dto.AiAgentRequest;
import com.example.backend.dto.AiAgentResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class AiAgentService {

    private final BrainClientService brainClient;

    public AiAgentService(BrainClientService brainClient) {
        this.brainClient = brainClient;
    }

    public AiAgentResponse process(AiAgentRequest request) {
        String query = request.getQuery();

        // Etape 1 : règles locales très rapides (IntentMapper simplifié)
        AiAgentResponse localResponse = parseLocalRules(query);
        if (localResponse.getIntent().getConfidence() >= 0.8) {
            return localResponse;
        }

        // Etape 2 : appel au brain/agent-service (LLM)
        AgentBrainRequest brainReq = new AgentBrainRequest();
        brainReq.setQuery(query);
        brainReq.setContext(request.getContext());
        brainReq.setConversationId(request.getConversationId());

        Optional<AgentBrainResponse> brainOpt = brainClient.processAgentQuery(brainReq);
        if (brainOpt.isPresent()) {
            AgentBrainResponse bResp = brainOpt.get();
            AiAgentResponse finalResp = new AiAgentResponse();

            AiAgentResponse.AgentIntent intent = new AiAgentResponse.AgentIntent();
            intent.setType(bResp.getIntentType());
            intent.setConfidence(bResp.getConfidence());
            intent.setParams(bResp.getParams());

            finalResp.setIntent(intent);
            finalResp.setAnswer(bResp.getAnswer());
            finalResp.setActions(bResp.getActions());
            finalResp.setEngine(bResp.getEngine());

            return finalResp;
        }

        // Fallback si le brain est down
        return localResponse;
    }

    private AiAgentResponse parseLocalRules(String query) {
        AiAgentResponse res = new AiAgentResponse();
        AiAgentResponse.AgentIntent intent = new AiAgentResponse.AgentIntent();
        res.setIntent(intent);
        res.setActions(new ArrayList<>());
        res.setEngine("rules-java");
        intent.setParams(new HashMap<>());

        String lower = query.toLowerCase();

        if (lower.contains("cherche") || lower.contains("trouve") || lower.contains("recherche")) {
            intent.setType("SEARCH");
            intent.setConfidence(0.85);
            res.setAnswer("Je lance la recherche pour vous.");
            Map<String, Object> params = new HashMap<>();
            if (lower.contains("casablanca"))
                params.put("city", "Casablanca");
            if (lower.contains("t3"))
                params.put("propertyType", "T3");
            intent.setParams(params);
        } else if (lower.contains("créer") || (lower.contains("nouveau") && lower.contains("dossier"))) {
            intent.setType("CREATE");
            intent.setConfidence(0.9);
            res.setAnswer("Je vous ouvre le formulaire de création de dossier.");
            Map<String, Object> action = new HashMap<>();
            action.put("label", "Créer Dossier");
            action.put("icon", "add");
            action.put("url", "/dossiers?action=create");
            res.getActions().add(action);
            intent.setParams(new HashMap<>());
        } else {
            intent.setType("UNKNOWN");
            intent.setConfidence(0.1);
            res.setAnswer("Je n'ai pas compris votre demande (offline).");
            intent.setParams(new HashMap<>());
        }

        return res;
    }
}
