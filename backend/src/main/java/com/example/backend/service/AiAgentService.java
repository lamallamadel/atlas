package com.example.backend.service;

import com.example.backend.brain.BrainClientService;
import com.example.backend.brain.dto.AgentBrainRequest;
import com.example.backend.brain.dto.AgentBrainResponse;
import com.example.backend.dto.AiAgentRequest;
import com.example.backend.dto.AiAgentResponse;

import java.util.ArrayList;
import java.util.HashMap;
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

        // 1: Direct integration with the Brain python service
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

        // 2: Fallback if Brain is unreachable
        return getFallbackResponse();
    }

    private AiAgentResponse getFallbackResponse() {
        AiAgentResponse res = new AiAgentResponse();
        AiAgentResponse.AgentIntent intent = new AiAgentResponse.AgentIntent();
        intent.setType("UNKNOWN");
        intent.setConfidence(0.0);
        intent.setParams(new HashMap<>());
        
        res.setIntent(intent);
        res.setActions(new ArrayList<>());
        res.setEngine("java-fallback");
        res.setAnswer("Je suis désolé, mes services cognitifs (AI Brain) sont actuellement inaccessibles.");

        return res;
    }
}
