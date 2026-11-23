package com.example.backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.annotation.BackendE2ETest;
import com.example.backend.annotation.BaseBackendE2ETest;
import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.entity.WorkflowTransition;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.WorkflowDefinitionRepository;
import com.example.backend.repository.WorkflowTransitionRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;

/**
 * ADR 0004, phase A : un dossier a toujours un type et un code de statut de la nomenclature, et ses
 * transitions passent par le workflow de son type (modèle système ou définition de l'organisation).
 * Sans semis de référentiels pour l'organisation (comme en prod).
 */
@BackendE2ETest
@WithMockUser(roles = {"PRO", "ADMIN"})
class DossierCaseTypeWorkflowBackendE2ETest extends BaseBackendE2ETest {

    private static final String ORG_ID = "org-adr-0004";

    @Autowired private DossierRepository dossierRepository;
    @Autowired private WorkflowDefinitionRepository workflowDefinitionRepository;
    @Autowired private WorkflowTransitionRepository workflowTransitionRepository;

    @Override
    protected String[] e2eJwtRoles() {
        return new String[] {"PRO", "ADMIN"};
    }

    private long createDossier(String caseType, String phone) throws Exception {
        DossierCreateRequest r = new DossierCreateRequest();
        r.setLeadName("Client ADR");
        r.setLeadPhone(phone);
        r.setCaseType(caseType);
        String body =
                mockMvc.perform(
                                withTenantHeaders(post("/api/v1/dossiers"), ORG_ID)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(r)))
                        .andExpect(status().isCreated())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private org.springframework.test.web.servlet.ResultActions patchStatus(
            long id, DossierStatus status) throws Exception {
        DossierStatusPatchRequest p = new DossierStatusPatchRequest();
        p.setStatus(status);
        p.setUserId("agent-1");
        p.setReason("test");
        return mockMvc.perform(
                withTenantHeaders(patch("/api/v1/dossiers/{id}/status", id), ORG_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(p)));
    }

    @Test
    void dossierWithoutCaseTypeGetsDefaultTypeAndNomenclatureCode() throws Exception {
        DossierCreateRequest r = new DossierCreateRequest();
        r.setLeadName("Sans type");
        r.setLeadPhone("+212600100001");

        mockMvc.perform(
                        withTenantHeaders(post("/api/v1/dossiers"), ORG_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.caseType").value("CRM_LEAD"))
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.statusCode").value("CRM_NEW"));
    }

    @Test
    void knownCaseTypeIsAcceptedWithoutOrgSeeding() throws Exception {
        long id = createDossier("CRM_LEAD_BUY", "+212600100002");

        Dossier saved = dossierRepository.findById(id).orElseThrow();
        assertThat(saved.getCaseType()).isEqualTo("CRM_LEAD_BUY");
        assertThat(saved.getStatusCode()).isEqualTo("CRM_NEW");
    }

    @Test
    void unknownCaseTypeIsRejected() throws Exception {
        DossierCreateRequest r = new DossierCreateRequest();
        r.setLeadName("Type inconnu");
        r.setLeadPhone("+212600100003");
        r.setCaseType("DEMO");

        mockMvc.perform(
                        withTenantHeaders(post("/api/v1/dossiers"), ORG_ID)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void typedDossierFollowsSystemWorkflowUpToClosing() throws Exception {
        long id = createDossier("CRM_LEAD_RENT", "+212600100004");

        patchStatus(id, DossierStatus.QUALIFYING)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("CRM_QUALIFYING"));
        patchStatus(id, DossierStatus.QUALIFIED)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("CRM_QUALIFIED"));
        patchStatus(id, DossierStatus.APPOINTMENT)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("CRM_VISIT_PLANNED"));
        // Phase A : pas encore de raison exigée (l'écran Pro ne l'envoie pas).
        patchStatus(id, DossierStatus.LOST)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOST"))
                .andExpect(jsonPath("$.statusCode").value("CRM_CLOSED_LOST"));

        List<WorkflowTransition> recorded = workflowTransitionRepository.findByDossierId(id);
        assertThat(recorded).hasSize(4).allMatch(t -> Boolean.TRUE.equals(t.getIsAllowed()));
        assertThat(recorded)
                .extracting(WorkflowTransition::getToStatus)
                .contains("CRM_QUALIFYING", "CRM_CLOSED_LOST");
    }

    @Test
    void forbiddenTransitionIsStillRejected() throws Exception {
        long id = createDossier("CRM_LEAD_BUY", "+212600100005");

        patchStatus(id, DossierStatus.WON).andExpect(status().is4xxClientError());

        assertThat(dossierRepository.findById(id).orElseThrow().getStatus())
                .isEqualTo(DossierStatus.NEW);
    }

    @Test
    void publishedOrgWorkflowOverridesSystemModel() throws Exception {
        WorkflowDefinition def = new WorkflowDefinition();
        def.setOrgId(ORG_ID);
        def.setName("Location stricte");
        def.setCaseType("CRM_LEAD_RENT");
        def.setVersion(1);
        def.setIsActive(true);
        def.setIsPublished(true);
        def.setInitialState("CRM_NEW");
        def.setStatesJson(
                List.of(
                        Map.of("stateCode", "CRM_NEW", "isInitial", true),
                        Map.of("stateCode", "CRM_QUALIFIED"),
                        Map.of("stateCode", "CRM_CLOSED_LOST", "isFinal", true)));
        // Pas de CRM_NEW -> CRM_QUALIFYING dans ce workflow.
        def.setTransitionsJson(
                List.of(
                        Map.of("fromState", "CRM_NEW", "toState", "CRM_QUALIFIED"),
                        Map.of("fromState", "CRM_NEW", "toState", "CRM_CLOSED_LOST")));
        workflowDefinitionRepository.saveAndFlush(def);

        long id = createDossier("CRM_LEAD_RENT", "+212600100006");

        patchStatus(id, DossierStatus.QUALIFYING).andExpect(status().isBadRequest());
        patchStatus(id, DossierStatus.QUALIFIED)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("CRM_QUALIFIED"));
    }

    @Test
    void vitrineDemoRequestIsRecordedAsB2bDemoLead() throws Exception {
        DossierCreateRequest r = new DossierCreateRequest();
        r.setLeadName("Agence Démo");
        r.setLeadPhone("+212600100007");
        r.setLeadSource("VITRINE");
        r.setCaseType("CRM_LEAD_B2B_DEMO");

        mockMvc.perform(
                        withTenantHeaders(post("/api/v1/portal/leads"), "ORG-001")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(r)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.caseType").value("CRM_LEAD_B2B_DEMO"))
                .andExpect(jsonPath("$.statusCode").value("CRM_NEW"));
    }
}
