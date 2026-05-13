package com.example.backend.workflow.action;

import com.example.backend.entity.Dossier;
import com.example.backend.service.OutboundMessageService;
import com.example.backend.entity.enums.MessageChannel;
import java.util.Map;
import java.util.HashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class SendEmailActionHandler implements WorkflowActionHandler {

    private static final Logger logger = LoggerFactory.getLogger(SendEmailActionHandler.class);
    public static final String ACTION_TYPE = "SEND_EMAIL";

    private final OutboundMessageService outboundMessageService;

    public SendEmailActionHandler(OutboundMessageService outboundMessageService) {
        this.outboundMessageService = outboundMessageService;
    }

    @Override
    public boolean supports(String actionType) {
        return ACTION_TYPE.equalsIgnoreCase(actionType);
    }

    @Override
    public void execute(Dossier dossier, Map<String, Object> actionConfig, String userId) {
        try {
            String templateCode = (String) actionConfig.get("template");
            String subject = (String) actionConfig.getOrDefault("subject", "Notification Atlas Immobilier");
            String to = (String) actionConfig.get("to");
            
            if (to == null) {
                to = dossier.getLeadEmail() != null ? dossier.getLeadEmail() : dossier.getLeadPhone();
            }

            if (templateCode == null || to == null) {
                logger.warn("Cannot send email: missing template or destination for dossier {}", dossier.getId());
                return;
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("dossier_id", dossier.getId());
            payload.put("lead_name", dossier.getLeadName() != null ? dossier.getLeadName() : "");
            
            if (actionConfig.get("payload") instanceof Map) {
                payload.putAll((Map<String, Object>) actionConfig.get("payload"));
            }

            outboundMessageService.createOutboundMessage(
                    dossier.getId(),
                    MessageChannel.EMAIL,
                    to,
                    templateCode,
                    subject,
                    payload,
                    null // idempotencyKey
            );
            
            logger.info("Successfully queued email using template '{}' for dossier {}", templateCode, dossier.getId());
            
        } catch (Exception e) {
            logger.error("Failed to execute SEND_EMAIL action for dossier {}", dossier.getId(), e);
        }
    }
}
