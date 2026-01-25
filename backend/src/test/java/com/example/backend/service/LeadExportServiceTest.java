package com.example.backend.service;

import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierSource;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.jpa.domain.Specification;

import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LeadExportServiceTest {

    @Mock
    private DossierRepository dossierRepository;

    @InjectMocks
    private LeadExportService leadExportService;

    private AutoCloseable closeable;

    @BeforeEach
    void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        TenantContext.setOrgId("test-org");
    }

    @AfterEach
    void tearDown() throws Exception {
        TenantContext.clear();
        closeable.close();
    }

    @Test
    void testExportLeads_Success() throws Exception {
        Dossier dossier1 = createTestDossier(1L, "John Doe", "+33612345678", "john@example.com");
        Dossier dossier2 = createTestDossier(2L, "Jane Smith", "+33698765432", "jane@example.com");

        when(dossierRepository.findAll(any(Specification.class)))
                .thenReturn(Arrays.asList(dossier1, dossier2));

        StringWriter writer = new StringWriter();
        List<String> columns = Arrays.asList("id", "name", "phone", "email");

        leadExportService.exportLeads(writer, null, null, null, null, columns);

        String output = writer.toString();
        assertNotNull(output);
        assertTrue(output.contains("id"));
        assertTrue(output.contains("name"));
        assertTrue(output.contains("phone"));
        assertTrue(output.contains("email"));
        assertTrue(output.contains("John Doe"));
        assertTrue(output.contains("Jane Smith"));

        verify(dossierRepository, times(1)).findAll(any(Specification.class));
    }

    @Test
    void testExportLeads_WithFilters() throws Exception {
        Dossier dossier = createTestDossier(1L, "John Doe", "+33612345678", "john@example.com");

        when(dossierRepository.findAll(any(Specification.class)))
                .thenReturn(Arrays.asList(dossier));

        StringWriter writer = new StringWriter();
        List<String> columns = Arrays.asList("id", "name", "status");

        leadExportService.exportLeads(
                writer,
                DossierStatus.NEW,
                LocalDateTime.now().minusDays(7),
                LocalDateTime.now(),
                DossierSource.WEB,
                columns
        );

        String output = writer.toString();
        assertNotNull(output);
        assertTrue(output.contains("id"));
        assertTrue(output.contains("name"));
        assertTrue(output.contains("status"));

        verify(dossierRepository, times(1)).findAll(any(Specification.class));
    }

    @Test
    void testExportLeads_DefaultColumns() throws Exception {
        Dossier dossier = createTestDossier(1L, "John Doe", "+33612345678", "john@example.com");

        when(dossierRepository.findAll(any(Specification.class)))
                .thenReturn(Arrays.asList(dossier));

        StringWriter writer = new StringWriter();

        leadExportService.exportLeads(writer, null, null, null, null, null);

        String output = writer.toString();
        assertNotNull(output);
        assertTrue(output.contains("id"));
        assertTrue(output.contains("name"));
        assertTrue(output.contains("phone"));
        assertTrue(output.contains("email"));

        verify(dossierRepository, times(1)).findAll(any(Specification.class));
    }

    @Test
    void testExportLeads_AllColumns() throws Exception {
        Dossier dossier = createTestDossier(1L, "John Doe", "+33612345678", "john@example.com");
        dossier.setScore(85);
        dossier.setNotes("Test notes");
        dossier.setAnnonceId(100L);
        dossier.setCaseType("RENTAL");
        dossier.setStatusCode("ACTIVE");

        when(dossierRepository.findAll(any(Specification.class)))
                .thenReturn(Arrays.asList(dossier));

        StringWriter writer = new StringWriter();
        List<String> columns = Arrays.asList(
                "id", "name", "phone", "email", "source", "lead_source",
                "status", "score", "notes", "annonce_id", "case_type",
                "status_code", "created_at", "updated_at"
        );

        leadExportService.exportLeads(writer, null, null, null, null, columns);

        String output = writer.toString();
        assertNotNull(output);
        assertTrue(output.contains("John Doe"));
        assertTrue(output.contains("+33612345678"));
        assertTrue(output.contains("85"));
        assertTrue(output.contains("Test notes"));
        assertTrue(output.contains("100"));

        verify(dossierRepository, times(1)).findAll(any(Specification.class));
    }

    @Test
    void testExportLeads_EmptyResults() throws Exception {
        when(dossierRepository.findAll(any(Specification.class)))
                .thenReturn(Arrays.asList());

        StringWriter writer = new StringWriter();
        List<String> columns = Arrays.asList("id", "name", "phone");

        leadExportService.exportLeads(writer, null, null, null, null, columns);

        String output = writer.toString();
        assertNotNull(output);
        assertTrue(output.contains("id"));
        assertTrue(output.contains("name"));
        assertTrue(output.contains("phone"));

        verify(dossierRepository, times(1)).findAll(any(Specification.class));
    }

    @Test
    void testExportLeads_NoOrgId() {
        TenantContext.clear();

        StringWriter writer = new StringWriter();
        List<String> columns = Arrays.asList("id", "name");

        assertThrows(IllegalStateException.class, () -> {
            leadExportService.exportLeads(writer, null, null, null, null, columns);
        });
    }

    private Dossier createTestDossier(Long id, String name, String phone, String email) {
        Dossier dossier = new Dossier();
        dossier.setId(id);
        dossier.setOrgId("test-org");
        dossier.setLeadName(name);
        dossier.setLeadPhone(phone);
        dossier.setLeadEmail(email);
        dossier.setSource(DossierSource.WEB);
        dossier.setLeadSource("Website");
        dossier.setStatus(DossierStatus.NEW);
        dossier.setCreatedAt(LocalDateTime.now());
        dossier.setUpdatedAt(LocalDateTime.now());
        return dossier;
    }
}
