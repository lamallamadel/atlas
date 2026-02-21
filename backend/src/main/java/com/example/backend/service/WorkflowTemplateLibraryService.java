package com.example.backend.service;

import com.example.backend.dto.WorkflowDefinitionMapper;
import com.example.backend.dto.WorkflowDefinitionResponse;
import com.example.backend.dto.WorkflowTemplateResponse;
import com.example.backend.entity.WorkflowDefinition;
import com.example.backend.repository.WorkflowDefinitionRepository;
import com.example.backend.util.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkflowTemplateLibraryService {

    private final WorkflowDefinitionRepository workflowDefinitionRepository;
    private final WorkflowDefinitionMapper workflowDefinitionMapper;

    public WorkflowTemplateLibraryService(
            WorkflowDefinitionRepository workflowDefinitionRepository,
            WorkflowDefinitionMapper workflowDefinitionMapper) {
        this.workflowDefinitionRepository = workflowDefinitionRepository;
        this.workflowDefinitionMapper = workflowDefinitionMapper;
    }

    @Transactional(readOnly = true)
    public List<WorkflowTemplateResponse> listTemplates(String category) {
        List<WorkflowDefinition> templates;

        if (category != null && !category.isBlank()) {
            templates = workflowDefinitionRepository.findTemplatesByCategory("SYSTEM", category);
        } else {
            templates = workflowDefinitionRepository.findAllTemplates();
        }

        return templates.stream()
                .map(this::toTemplateResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkflowDefinitionResponse instantiateTemplate(Long templateId, String customName) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        WorkflowDefinition template = workflowDefinitionRepository.findById(templateId)
                .orElseThrow(() -> new IllegalArgumentException("Template not found with id: " + templateId));

        if (!template.getIsTemplate()) {
            throw new IllegalArgumentException("Workflow with id " + templateId + " is not a template");
        }

        WorkflowDefinition newWorkflow = new WorkflowDefinition();
        newWorkflow.setOrgId(orgId);
        newWorkflow.setName(customName != null ? customName : template.getName());
        newWorkflow.setDescription(template.getDescription());
        newWorkflow.setCaseType(template.getCaseType());
        newWorkflow.setVersion(1);
        newWorkflow.setIsActive(false);
        newWorkflow.setIsPublished(false);
        newWorkflow.setIsTemplate(false);
        newWorkflow.setStatesJson(new ArrayList<>(template.getStatesJson()));
        newWorkflow.setTransitionsJson(new ArrayList<>(template.getTransitionsJson()));
        newWorkflow.setMetadataJson(template.getMetadataJson() != null ? new HashMap<>(template.getMetadataJson()) : null);
        newWorkflow.setInitialState(template.getInitialState());
        newWorkflow.setFinalStates(template.getFinalStates());

        LocalDateTime now = LocalDateTime.now();
        newWorkflow.setCreatedAt(now);
        newWorkflow.setUpdatedAt(now);

        WorkflowDefinition saved = workflowDefinitionRepository.save(newWorkflow);
        return workflowDefinitionMapper.toResponse(saved);
    }

    @Transactional
    public void seedSystemTemplates() {
        seedSaleTemplate();
        seedRentalTemplate();
        seedMandateTemplate();
        seedConstructionTemplate();
    }

    private void seedSaleTemplate() {
        if (templateExists("SALE_STANDARD")) {
            return;
        }

        WorkflowDefinition template = new WorkflowDefinition();
        template.setOrgId("SYSTEM");
        template.setName("Standard Sales Workflow");
        template.setDescription("Pre-built workflow for property sale transactions");
        template.setCaseType("SALE");
        template.setVersion(1);
        template.setIsActive(false);
        template.setIsPublished(true);
        template.setIsTemplate(true);
        template.setTemplateCategory("SALE");
        template.setInitialState("NEW");
        template.setFinalStates("WON,LOST");

        List<Map<String, Object>> states = new ArrayList<>();
        states.add(createState("NEW", "New Lead", "initial", "#3B82F6", 100, 100));
        states.add(createState("QUALIFYING", "Qualifying", "intermediate", "#F59E0B", 300, 100));
        states.add(createState("QUALIFIED", "Qualified", "intermediate", "#10B981", 500, 100));
        states.add(createState("PROPOSAL", "Proposal Sent", "intermediate", "#8B5CF6", 700, 100));
        states.add(createState("WON", "Won", "final", "#059669", 900, 50));
        states.add(createState("LOST", "Lost", "final", "#DC2626", 900, 150));

        List<Map<String, Object>> transitions = new ArrayList<>();
        transitions.add(createTransition("NEW", "QUALIFYING", "Start Qualification", Arrays.asList("leadName", "leadPhone")));
        transitions.add(createTransition("QUALIFYING", "QUALIFIED", "Qualify Lead", Arrays.asList("leadEmail", "budget")));
        transitions.add(createTransition("QUALIFIED", "PROPOSAL", "Send Proposal", Arrays.asList("propertyId")));
        transitions.add(createTransition("PROPOSAL", "WON", "Close Deal", Arrays.asList("wonReason")));
        transitions.add(createTransition("PROPOSAL", "LOST", "Mark as Lost", Arrays.asList("lossReason")));
        transitions.add(createTransition("QUALIFYING", "LOST", "Disqualify", Arrays.asList("lossReason")));

        template.setStatesJson(states);
        template.setTransitionsJson(transitions);

        workflowDefinitionRepository.save(template);
    }

    private void seedRentalTemplate() {
        if (templateExists("RENTAL_STANDARD")) {
            return;
        }

        WorkflowDefinition template = new WorkflowDefinition();
        template.setOrgId("SYSTEM");
        template.setName("Standard Rental Workflow");
        template.setDescription("Pre-built workflow for property rental transactions");
        template.setCaseType("RENTAL");
        template.setVersion(1);
        template.setIsActive(false);
        template.setIsPublished(true);
        template.setIsTemplate(true);
        template.setTemplateCategory("RENTAL");
        template.setInitialState("NEW");
        template.setFinalStates("RENTED,LOST");

        List<Map<String, Object>> states = new ArrayList<>();
        states.add(createState("NEW", "New Inquiry", "initial", "#3B82F6", 100, 100));
        states.add(createState("VIEWING", "Viewing Scheduled", "intermediate", "#F59E0B", 300, 100));
        states.add(createState("APPLICATION", "Application Submitted", "intermediate", "#8B5CF6", 500, 100));
        states.add(createState("SCREENING", "Tenant Screening", "intermediate", "#10B981", 700, 100));
        states.add(createState("RENTED", "Rented", "final", "#059669", 900, 50));
        states.add(createState("LOST", "Lost", "final", "#DC2626", 900, 150));

        List<Map<String, Object>> transitions = new ArrayList<>();
        transitions.add(createTransition("NEW", "VIEWING", "Schedule Viewing", Arrays.asList("leadName", "leadPhone")));
        transitions.add(createTransition("VIEWING", "APPLICATION", "Receive Application", Arrays.asList("leadEmail")));
        transitions.add(createTransition("APPLICATION", "SCREENING", "Start Screening", Collections.emptyList()));
        transitions.add(createTransition("SCREENING", "RENTED", "Approve & Rent", Arrays.asList("wonReason")));
        transitions.add(createTransition("SCREENING", "LOST", "Reject Application", Arrays.asList("lossReason")));
        transitions.add(createTransition("VIEWING", "LOST", "No Follow-up", Arrays.asList("lossReason")));

        template.setStatesJson(states);
        template.setTransitionsJson(transitions);

        workflowDefinitionRepository.save(template);
    }

    private void seedMandateTemplate() {
        if (templateExists("MANDATE_STANDARD")) {
            return;
        }

        WorkflowDefinition template = new WorkflowDefinition();
        template.setOrgId("SYSTEM");
        template.setName("Standard Mandate Workflow");
        template.setDescription("Pre-built workflow for property mandate acquisitions");
        template.setCaseType("MANDATE");
        template.setVersion(1);
        template.setIsActive(false);
        template.setIsPublished(true);
        template.setIsTemplate(true);
        template.setTemplateCategory("MANDATE");
        template.setInitialState("LEAD");
        template.setFinalStates("SIGNED,LOST");

        List<Map<String, Object>> states = new ArrayList<>();
        states.add(createState("LEAD", "Lead", "initial", "#3B82F6", 100, 100));
        states.add(createState("CONTACT", "Initial Contact", "intermediate", "#F59E0B", 300, 100));
        states.add(createState("EVALUATION", "Property Evaluation", "intermediate", "#8B5CF6", 500, 100));
        states.add(createState("PROPOSAL", "Mandate Proposal", "intermediate", "#10B981", 700, 100));
        states.add(createState("SIGNED", "Mandate Signed", "final", "#059669", 900, 50));
        states.add(createState("LOST", "Lost", "final", "#DC2626", 900, 150));

        List<Map<String, Object>> transitions = new ArrayList<>();
        transitions.add(createTransition("LEAD", "CONTACT", "Establish Contact", Arrays.asList("leadName", "leadPhone")));
        transitions.add(createTransition("CONTACT", "EVALUATION", "Schedule Evaluation", Arrays.asList("propertyAddress")));
        transitions.add(createTransition("EVALUATION", "PROPOSAL", "Send Proposal", Arrays.asList("estimatedValue")));
        transitions.add(createTransition("PROPOSAL", "SIGNED", "Sign Mandate", Arrays.asList("wonReason", "mandateDate")));
        transitions.add(createTransition("PROPOSAL", "LOST", "Proposal Rejected", Arrays.asList("lossReason")));
        transitions.add(createTransition("CONTACT", "LOST", "No Interest", Arrays.asList("lossReason")));

        template.setStatesJson(states);
        template.setTransitionsJson(transitions);

        workflowDefinitionRepository.save(template);
    }

    private void seedConstructionTemplate() {
        if (templateExists("CONSTRUCTION_STANDARD")) {
            return;
        }

        WorkflowDefinition template = new WorkflowDefinition();
        template.setOrgId("SYSTEM");
        template.setName("Standard Construction Workflow");
        template.setDescription("Pre-built workflow for new construction projects");
        template.setCaseType("CONSTRUCTION");
        template.setVersion(1);
        template.setIsActive(false);
        template.setIsPublished(true);
        template.setIsTemplate(true);
        template.setTemplateCategory("CONSTRUCTION");
        template.setInitialState("INQUIRY");
        template.setFinalStates("COMPLETED,CANCELLED");

        List<Map<String, Object>> states = new ArrayList<>();
        states.add(createState("INQUIRY", "Inquiry", "initial", "#3B82F6", 100, 100));
        states.add(createState("PLANNING", "Planning", "intermediate", "#F59E0B", 300, 100));
        states.add(createState("PERMITS", "Permits & Approvals", "intermediate", "#8B5CF6", 500, 100));
        states.add(createState("CONSTRUCTION", "Under Construction", "intermediate", "#10B981", 700, 100));
        states.add(createState("INSPECTION", "Final Inspection", "intermediate", "#06B6D4", 900, 100));
        states.add(createState("COMPLETED", "Completed", "final", "#059669", 1100, 50));
        states.add(createState("CANCELLED", "Cancelled", "final", "#DC2626", 1100, 150));

        List<Map<String, Object>> transitions = new ArrayList<>();
        transitions.add(createTransition("INQUIRY", "PLANNING", "Start Planning", Arrays.asList("clientName", "projectType")));
        transitions.add(createTransition("PLANNING", "PERMITS", "Submit for Permits", Arrays.asList("blueprints")));
        transitions.add(createTransition("PERMITS", "CONSTRUCTION", "Start Construction", Arrays.asList("permitApproval")));
        transitions.add(createTransition("CONSTRUCTION", "INSPECTION", "Request Inspection", Collections.emptyList()));
        transitions.add(createTransition("INSPECTION", "COMPLETED", "Complete Project", Arrays.asList("completionDate")));
        transitions.add(createTransition("PLANNING", "CANCELLED", "Cancel Project", Arrays.asList("lossReason")));
        transitions.add(createTransition("PERMITS", "CANCELLED", "Cancel Project", Arrays.asList("lossReason")));

        template.setStatesJson(states);
        template.setTransitionsJson(transitions);

        workflowDefinitionRepository.save(template);
    }

    private Map<String, Object> createState(String code, String name, String type, String color, int x, int y) {
        Map<String, Object> state = new HashMap<>();
        state.put("stateCode", code);
        state.put("stateName", name);
        state.put("stateType", type);
        state.put("color", color);
        state.put("positionX", x);
        state.put("positionY", y);
        state.put("isInitial", "initial".equals(type));
        state.put("isFinal", "final".equals(type));
        return state;
    }

    private Map<String, Object> createTransition(String from, String to, String label, List<String> requiredFields) {
        Map<String, Object> transition = new HashMap<>();
        transition.put("fromState", from);
        transition.put("toState", to);
        transition.put("label", label);
        transition.put("requiredFields", requiredFields);
        transition.put("allowedRoles", Arrays.asList("ADMIN", "AGENT", "MANAGER"));
        transition.put("isActive", true);
        return transition;
    }

    private boolean templateExists(String caseType) {
        return !workflowDefinitionRepository.findTemplatesByCategory("SYSTEM", caseType).isEmpty();
    }

    private WorkflowTemplateResponse toTemplateResponse(WorkflowDefinition template) {
        WorkflowTemplateResponse response = new WorkflowTemplateResponse();
        response.setId(template.getId());
        response.setName(template.getName());
        response.setDescription(template.getDescription());
        response.setCategory(template.getTemplateCategory());
        response.setCaseType(template.getCaseType());
        response.setStateCount(template.getStatesJson() != null ? template.getStatesJson().size() : 0);
        response.setTransitionCount(template.getTransitionsJson() != null ? template.getTransitionsJson().size() : 0);
        return response;
    }
}
