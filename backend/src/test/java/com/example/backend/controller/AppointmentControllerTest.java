package com.example.backend.controller;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.backend.dto.AppointmentCreateRequest;
import com.example.backend.dto.AppointmentUpdateRequest;
import com.example.backend.entity.AppointmentEntity;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AppointmentStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AppointmentRepository;
import com.example.backend.repository.DossierRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AppointmentControllerTest {

    private static final String ORG_ID_HEADER = "X-Org-Id";
    private static final String CORRELATION_ID_HEADER = "X-Correlation-Id";
    private static final String ORG_ID = "org123";
    private static final String ORG_ID_2 = "org456";
    private static final String CORRELATION_ID = "test-correlation-id";

    @Autowired private MockMvc mockMvc;

    @Autowired private ObjectMapper objectMapper;

    @Autowired private AppointmentRepository appointmentRepository;

    @Autowired private DossierRepository dossierRepository;

    private <T extends MockHttpServletRequestBuilder> T withHeaders(T builder) {
        return (T)
                builder.header(ORG_ID_HEADER, ORG_ID).header(CORRELATION_ID_HEADER, CORRELATION_ID);
    }

    private <T extends org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder>
            T withHeaders(T builder, String orgId) {
        return (T)
                builder.header(ORG_ID_HEADER, orgId).header(CORRELATION_ID_HEADER, CORRELATION_ID);
    }
    ;

    @BeforeEach
    void setUp() {
        appointmentRepository.deleteAll();
        dossierRepository.deleteAll();
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_ValidRequest_Returns201WithCreatedAppointment() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(dossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 1, 10, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 1, 11, 0));
        request.setLocation("Office");
        request.setAssignedTo("agent@example.com");
        request.setNotes("Initial consultation");
        request.setStatus(AppointmentStatus.SCHEDULED);

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/appointments")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()))
                .andExpect(jsonPath("$.location").value("Office"))
                .andExpect(jsonPath("$.assignedTo").value("agent@example.com"))
                .andExpect(jsonPath("$.notes").value("Initial consultation"))
                .andExpect(jsonPath("$.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_MissingRequiredFields_Returns400() throws Exception {
        AppointmentCreateRequest request = new AppointmentCreateRequest();

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/appointments")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_StartTimeAfterEndTime_Returns400() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(dossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 1, 11, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 1, 10, 0));

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/appointments")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.detail", containsString("Start time must be before end time")));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_StartTimeEqualsEndTime_Returns400() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(dossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 1, 10, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 1, 10, 0));

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/appointments")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.detail", containsString("Start time must be before end time")));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void create_InvalidStatusEnum_Returns400() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        String invalidRequest =
                String.format(
                        "{\"dossierId\":%d,\"startTime\":\"2024-06-01T10:00:00\",\"endTime\":\"2024-06-01T11:00:00\",\"status\":\"INVALID_STATUS\"}",
                        dossier.getId());

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/appointments")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void create_WithAdminRole_Returns201() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(dossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 1, 10, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 1, 11, 0));

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/appointments")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void create_WithUserRole_Returns403() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentCreateRequest request = new AppointmentCreateRequest();
        request.setDossierId(dossier.getId());
        request.setStartTime(LocalDateTime.of(2024, 6, 1, 10, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 1, 11, 0));

        mockMvc.perform(
                        withHeaders(
                                post("/api/v1/appointments")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_ExistingAppointment_Returns200() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        AppointmentEntity appointment =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));

        mockMvc.perform(withHeaders(get("/api/v1/appointments/" + appointment.getId())))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(appointment.getId()))
                .andExpect(jsonPath("$.orgId").value(ORG_ID))
                .andExpect(jsonPath("$.dossierId").value(dossier.getId()));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_NonExistentAppointment_Returns404() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/appointments/99999")))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void getById_DifferentTenant_Returns404() throws Exception {
        Dossier dossier = createDossier(ORG_ID_2);
        AppointmentEntity appointment =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));

        mockMvc.perform(withHeaders(get("/api/v1/appointments/" + appointment.getId())))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void update_ValidRequest_Returns200() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        AppointmentEntity appointment =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));

        AppointmentUpdateRequest request = new AppointmentUpdateRequest();
        request.setStartTime(LocalDateTime.of(2024, 6, 2, 14, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 2, 15, 0));
        request.setStatus(AppointmentStatus.COMPLETED);
        request.setNotes("Updated notes");

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/appointments/" + appointment.getId())
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(appointment.getId()))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.notes").value("Updated notes"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void update_StartTimeAfterEndTime_Returns400() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        AppointmentEntity appointment =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));

        AppointmentUpdateRequest request = new AppointmentUpdateRequest();
        request.setStartTime(LocalDateTime.of(2024, 6, 2, 15, 0));
        request.setEndTime(LocalDateTime.of(2024, 6, 2, 14, 0));

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/appointments/" + appointment.getId())
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isBadRequest())
                .andExpect(
                        jsonPath("$.detail", containsString("Start time must be before end time")));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void update_NonExistentAppointment_Returns404() throws Exception {
        AppointmentUpdateRequest request = new AppointmentUpdateRequest();
        request.setStatus(AppointmentStatus.COMPLETED);

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/appointments/99999")
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(request))))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void update_InvalidStatusEnum_Returns400() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        AppointmentEntity appointment =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));

        String invalidRequest = "{\"status\":\"INVALID_STATUS\"}";

        mockMvc.perform(
                        withHeaders(
                                put("/api/v1/appointments/" + appointment.getId())
                                        .with(csrf())
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void delete_ExistingAppointment_Returns204() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        AppointmentEntity appointment =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));

        mockMvc.perform(
                        withHeaders(
                                delete("/api/v1/appointments/" + appointment.getId()).with(csrf())))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void delete_NonExistentAppointment_Returns404() throws Exception {
        mockMvc.perform(withHeaders(delete("/api/v1/appointments/99999").with(csrf())))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_WithPagination_ReturnsPagedResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);
        for (int i = 0; i < 25; i++) {
            createAppointment(
                    dossier,
                    LocalDateTime.of(2024, 6, 1, 10, i),
                    LocalDateTime.of(2024, 6, 1, 11, i));
        }

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/appointments")
                                        .param("dossierId", dossier.getId().toString())
                                        .param("page", "0")
                                        .param("size", "10")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.totalElements").value(25))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.number").value(0));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_FilterByDossierId_ReturnsFilteredResults() throws Exception {
        Dossier dossier1 = createDossier(ORG_ID);
        Dossier dossier2 = createDossier(ORG_ID);

        createAppointment(
                dossier1, LocalDateTime.of(2024, 6, 1, 10, 0), LocalDateTime.of(2024, 6, 1, 11, 0));
        createAppointment(
                dossier1, LocalDateTime.of(2024, 6, 2, 10, 0), LocalDateTime.of(2024, 6, 2, 11, 0));
        createAppointment(
                dossier2, LocalDateTime.of(2024, 6, 3, 10, 0), LocalDateTime.of(2024, 6, 3, 11, 0));

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/appointments")
                                        .param("dossierId", dossier1.getId().toString())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(
                        jsonPath(
                                "$.content[*].dossierId",
                                everyItem(is(dossier1.getId().intValue()))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_FilterByDateRange_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        createAppointment(
                dossier, LocalDateTime.of(2024, 6, 1, 10, 0), LocalDateTime.of(2024, 6, 1, 11, 0));
        createAppointment(
                dossier, LocalDateTime.of(2024, 6, 5, 10, 0), LocalDateTime.of(2024, 6, 5, 11, 0));
        createAppointment(
                dossier,
                LocalDateTime.of(2024, 6, 10, 10, 0),
                LocalDateTime.of(2024, 6, 10, 11, 0));

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/appointments")
                                        .param("from", "2024-06-03T00:00:00")
                                        .param("to", "2024-06-07T23:59:59")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_FilterByAssignedTo_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentEntity app1 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));
        app1.setAssignedTo("agent1@example.com");
        appointmentRepository.save(app1);

        AppointmentEntity app2 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 2, 10, 0),
                        LocalDateTime.of(2024, 6, 2, 11, 0));
        app2.setAssignedTo("agent2@example.com");
        appointmentRepository.save(app2);

        AppointmentEntity app3 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 3, 10, 0),
                        LocalDateTime.of(2024, 6, 3, 11, 0));
        app3.setAssignedTo("agent1@example.com");
        appointmentRepository.save(app3);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/appointments")
                                        .param("assignedTo", "agent1@example.com")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(
                        jsonPath("$.content[*].assignedTo", everyItem(is("agent1@example.com"))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_FilterByStatus_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentEntity app1 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));
        app1.setStatus(AppointmentStatus.SCHEDULED);
        appointmentRepository.save(app1);

        AppointmentEntity app2 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 2, 10, 0),
                        LocalDateTime.of(2024, 6, 2, 11, 0));
        app2.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(app2);

        AppointmentEntity app3 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 3, 10, 0),
                        LocalDateTime.of(2024, 6, 3, 11, 0));
        app3.setStatus(AppointmentStatus.SCHEDULED);
        appointmentRepository.save(app3);

        mockMvc.perform(withHeaders(get("/api/v1/appointments").param("status", "SCHEDULED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].status", everyItem(is("SCHEDULED"))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_FilterByMultipleCriteria_ReturnsFilteredResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentEntity app1 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));
        app1.setAssignedTo("agent1@example.com");
        app1.setStatus(AppointmentStatus.SCHEDULED);
        appointmentRepository.save(app1);

        AppointmentEntity app2 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 2, 10, 0),
                        LocalDateTime.of(2024, 6, 2, 11, 0));
        app2.setAssignedTo("agent1@example.com");
        app2.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(app2);

        AppointmentEntity app3 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 3, 10, 0),
                        LocalDateTime.of(2024, 6, 3, 11, 0));
        app3.setAssignedTo("agent2@example.com");
        app3.setStatus(AppointmentStatus.SCHEDULED);
        appointmentRepository.save(app3);

        mockMvc.perform(
                        withHeaders(
                                get("/api/v1/appointments")
                                        .param("assignedTo", "agent1@example.com")
                                        .param("status", "SCHEDULED")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].assignedTo").value("agent1@example.com"))
                .andExpect(jsonPath("$.content[0].status").value("SCHEDULED"));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_SortByStartTimeAsc_ReturnsSortedResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentEntity app1 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 3, 10, 0),
                        LocalDateTime.of(2024, 6, 3, 11, 0));
        AppointmentEntity app2 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));
        AppointmentEntity app3 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 2, 10, 0),
                        LocalDateTime.of(2024, 6, 2, 11, 0));

        mockMvc.perform(withHeaders(get("/api/v1/appointments").param("sort", "startTime,asc")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].id").value(app2.getId()))
                .andExpect(jsonPath("$.content[1].id").value(app3.getId()))
                .andExpect(jsonPath("$.content[2].id").value(app1.getId()));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_SortByStartTimeDesc_ReturnsSortedResults() throws Exception {
        Dossier dossier = createDossier(ORG_ID);

        AppointmentEntity app1 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 1, 10, 0),
                        LocalDateTime.of(2024, 6, 1, 11, 0));
        AppointmentEntity app2 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 2, 10, 0),
                        LocalDateTime.of(2024, 6, 2, 11, 0));
        AppointmentEntity app3 =
                createAppointment(
                        dossier,
                        LocalDateTime.of(2024, 6, 3, 10, 0),
                        LocalDateTime.of(2024, 6, 3, 11, 0));

        mockMvc.perform(withHeaders(get("/api/v1/appointments").param("sort", "startTime,desc")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.content[0].id").value(app3.getId()))
                .andExpect(jsonPath("$.content[1].id").value(app2.getId()))
                .andExpect(jsonPath("$.content[2].id").value(app1.getId()));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_MultiTenantIsolation_OnlyReturnsSameTenant() throws Exception {
        Dossier dossier1 = createDossier(ORG_ID);
        Dossier dossier2 = createDossier(ORG_ID_2);

        createAppointment(
                dossier1, LocalDateTime.of(2024, 6, 1, 10, 0), LocalDateTime.of(2024, 6, 1, 11, 0));
        createAppointment(
                dossier1, LocalDateTime.of(2024, 6, 2, 10, 0), LocalDateTime.of(2024, 6, 2, 11, 0));
        createAppointment(
                dossier2, LocalDateTime.of(2024, 6, 3, 10, 0), LocalDateTime.of(2024, 6, 3, 11, 0));

        mockMvc.perform(withHeaders(get("/api/v1/appointments")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[*].orgId", everyItem(is(ORG_ID))));

        mockMvc.perform(withHeaders(get("/api/v1/appointments"), ORG_ID_2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[*].orgId", everyItem(is(ORG_ID_2))));
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_InvalidStatusEnum_Returns400() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/appointments").param("status", "INVALID_STATUS")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"PRO"})
    void list_EmptyResults_ReturnsEmptyPage() throws Exception {
        mockMvc.perform(withHeaders(get("/api/v1/appointments")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    private Dossier createDossier(String orgId) {
        Dossier dossier = new Dossier();
        dossier.setOrgId(orgId);
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("Test User");
        dossier.setStatus(DossierStatus.NEW);
        return dossierRepository.save(dossier);
    }

    private AppointmentEntity createAppointment(
            Dossier dossier, LocalDateTime startTime, LocalDateTime endTime) {
        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setOrgId(dossier.getOrgId());
        appointment.setDossier(dossier);
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        return appointmentRepository.save(appointment);
    }
}
