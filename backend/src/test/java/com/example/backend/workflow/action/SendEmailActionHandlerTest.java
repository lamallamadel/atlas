package com.example.backend.workflow.action;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.service.OutboundMessageService;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SendEmailActionHandlerTest {

    @Mock
    private OutboundMessageService outboundMessageService;

    @InjectMocks
    private SendEmailActionHandler handler;

    @Test
    void testExecute_QueuesOutboundMessage() {
        Dossier dossier = new Dossier();
        dossier.setId(1L);
        dossier.setOrgId("org-1");
        dossier.setLeadEmail("test@example.com");
        
        Map<String, Object> config = Map.of(
                "template", "WELCOME",
                "subject", "Welcome home"
        );

        handler.execute(dossier, config, "user-1");

        verify(outboundMessageService).createOutboundMessage(
                eq(1L),
                eq(MessageChannel.EMAIL),
                eq("test@example.com"),
                eq("WELCOME"),
                eq("Welcome home"),
                any(),
                eq(null)
        );
    }
}
