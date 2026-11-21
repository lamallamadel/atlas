package com.example.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.OutboundMessageEntity;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.entity.enums.MessageChannel;
import com.example.backend.entity.enums.OutboundMessageStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.OutboundAttemptRepository;
import com.example.backend.repository.OutboundMessageRepository;
import com.example.backend.util.TenantContext;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * Sans @Transactional et sans organisation dans le contexte, comme le vrai planificateur : un
 * envoi réussi doit rester SENT et ne jamais repartir au passage suivant.
 */
@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = "outbound.worker.enabled=true")
class OutboundWorkerTenantTest {

    private static final String ORG = "org-worker-tenant";

    @Autowired private OutboundJobWorker worker;
    @Autowired private OutboundMessageRepository messageRepository;
    @Autowired private OutboundAttemptRepository attemptRepository;
    @Autowired private DossierRepository dossierRepository;

    @MockitoBean(name = "whatsAppCloudApiProvider")
    private WhatsAppCloudApiProvider provider;

    @AfterEach
    void tearDown() {
        attemptRepository.deleteAll();
        messageRepository.findAll().stream()
                .filter(m -> ORG.equals(m.getOrgId()))
                .forEach(messageRepository::delete);
        dossierRepository.findAll().stream()
                .filter(d -> ORG.equals(d.getOrgId()))
                .forEach(dossierRepository::delete);
        TenantContext.clear();
    }

    @Test
    void un_envoi_reussi_n_est_jamais_renvoye() {
        Dossier d = new Dossier();
        d.setOrgId(ORG);
        d.setLeadName("Adel");
        d.setLeadPhone("+212600000002");
        d.setStatus(DossierStatus.NEW);
        Long dossierId = dossierRepository.save(d).getId();

        OutboundMessageEntity m = new OutboundMessageEntity();
        m.setOrgId(ORG);
        m.setDossierId(dossierId);
        m.setChannel(MessageChannel.WHATSAPP);
        m.setDirection("OUTBOUND");
        m.setTo("+212600000002");
        m.setPayloadJson(Map.of("body", "Bonjour"));
        m.setStatus(OutboundMessageStatus.QUEUED);
        m.setIdempotencyKey(UUID.randomUUID().toString());
        m.setAttemptCount(0);
        m.setMaxAttempts(5);
        Long id = messageRepository.save(m).getId();

        when(provider.supports("WHATSAPP")).thenReturn(true);
        when(provider.supports(argThat(c -> !"WHATSAPP".equals(c)))).thenReturn(false);
        when(provider.send(any())).thenReturn(ProviderSendResult.success("wamid.TEST", Map.of()));

        TenantContext.clear();
        worker.processPendingMessages();
        worker.processPendingMessages();

        OutboundMessageEntity saved = messageRepository.findById(id).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(OutboundMessageStatus.SENT);
        assertThat(saved.getProviderMessageId()).isEqualTo("wamid.TEST");
        verify(provider, times(1)).send(argThat(x -> id.equals(x.getId())));
        assertThat(TenantContext.getOrgId()).isNull();
    }
}
