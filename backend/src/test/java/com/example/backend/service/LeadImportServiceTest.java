package com.example.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.backend.dto.LeadImportResponse;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.ImportJobEntity;
import com.example.backend.entity.enums.MergeStrategy;
import com.example.backend.repository.DossierRepository;
import com.example.backend.repository.ImportJobRepository;
import com.example.backend.util.TenantContext;
import java.util.Collections;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockMultipartFile;

class LeadImportServiceTest {

    @Mock private DossierRepository dossierRepository;

    @Mock private ImportJobRepository importJobRepository;

    @InjectMocks private LeadImportService leadImportService;

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
    void testImportLeads_Success() {
        String csvContent =
                "name,phone,email,source,lead_source,notes,score\n"
                        + "John Doe,+33612345678,john@example.com,web,Website,Test note,85\n";

        MockMultipartFile file =
                new MockMultipartFile("file", "leads.csv", "text/csv", csvContent.getBytes());

        ImportJobEntity importJob = new ImportJobEntity();
        importJob.setId(1L);
        importJob.setOrgId("test-org");

        when(importJobRepository.save(any(ImportJobEntity.class))).thenReturn(importJob);
        when(dossierRepository.findByLeadPhoneAndOrgIdAndStatusNotIn(
                        anyString(), anyString(), anyList()))
                .thenReturn(Collections.emptyList());

        LeadImportResponse response = leadImportService.importLeads(file, MergeStrategy.SKIP);

        assertNotNull(response);
        assertEquals(1L, response.getImportJobId());
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());
        assertEquals(0, response.getSkippedCount());

        verify(dossierRepository, times(1)).save(any(Dossier.class));
        verify(importJobRepository, times(2)).save(any(ImportJobEntity.class));
    }

    @Test
    void testImportLeads_WithValidationErrors() {
        String csvContent =
                "name,phone,email,source,lead_source,notes,score\n"
                        + ",+33612345678,john@example.com,web,Website,Test note,85\n";

        MockMultipartFile file =
                new MockMultipartFile("file", "leads.csv", "text/csv", csvContent.getBytes());

        ImportJobEntity importJob = new ImportJobEntity();
        importJob.setId(1L);
        importJob.setOrgId("test-org");

        when(importJobRepository.save(any(ImportJobEntity.class))).thenReturn(importJob);

        LeadImportResponse response = leadImportService.importLeads(file, MergeStrategy.SKIP);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getErrorCount());
        assertTrue(response.getValidationErrors().size() > 0);
    }

    @Test
    void testImportLeads_SkipDuplicates() {
        String csvContent =
                "name,phone,email,source,lead_source,notes,score\n"
                        + "John Doe,+33612345678,john@example.com,web,Website,Test note,85\n";

        MockMultipartFile file =
                new MockMultipartFile("file", "leads.csv", "text/csv", csvContent.getBytes());

        ImportJobEntity importJob = new ImportJobEntity();
        importJob.setId(1L);
        importJob.setOrgId("test-org");

        Dossier existingDossier = new Dossier();
        existingDossier.setId(1L);
        existingDossier.setLeadPhone("+33612345678");

        when(importJobRepository.save(any(ImportJobEntity.class))).thenReturn(importJob);
        when(dossierRepository.findByLeadPhoneAndOrgIdAndStatusNotIn(
                        anyString(), anyString(), anyList()))
                .thenReturn(Collections.singletonList(existingDossier));

        LeadImportResponse response = leadImportService.importLeads(file, MergeStrategy.SKIP);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());
        assertEquals(1, response.getSkippedCount());

        verify(dossierRepository, never()).save(any(Dossier.class));
    }

    @Test
    void testImportLeads_OverwriteDuplicates() {
        String csvContent =
                "name,phone,email,source,lead_source,notes,score\n"
                        + "John Updated,+33612345678,john.updated@example.com,web,Website,Updated note,90\n";

        MockMultipartFile file =
                new MockMultipartFile("file", "leads.csv", "text/csv", csvContent.getBytes());

        ImportJobEntity importJob = new ImportJobEntity();
        importJob.setId(1L);
        importJob.setOrgId("test-org");

        Dossier existingDossier = new Dossier();
        existingDossier.setId(1L);
        existingDossier.setLeadPhone("+33612345678");
        existingDossier.setLeadName("John Old");

        when(importJobRepository.save(any(ImportJobEntity.class))).thenReturn(importJob);
        when(dossierRepository.findByLeadPhoneAndOrgIdAndStatusNotIn(
                        anyString(), anyString(), anyList()))
                .thenReturn(Collections.singletonList(existingDossier));

        LeadImportResponse response = leadImportService.importLeads(file, MergeStrategy.OVERWRITE);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());
        assertEquals(0, response.getSkippedCount());

        ArgumentCaptor<Dossier> dossierCaptor = ArgumentCaptor.forClass(Dossier.class);
        verify(dossierRepository, times(1)).save(dossierCaptor.capture());

        Dossier savedDossier = dossierCaptor.getValue();
        assertEquals("John Updated", savedDossier.getLeadName());
        assertEquals("john.updated@example.com", savedDossier.getLeadEmail());
    }

    @Test
    void testImportLeads_CreateNewDuplicates() {
        String csvContent =
                "name,phone,email,source,lead_source,notes,score\n"
                        + "John Doe,+33612345678,john@example.com,web,Website,Test note,85\n";

        MockMultipartFile file =
                new MockMultipartFile("file", "leads.csv", "text/csv", csvContent.getBytes());

        ImportJobEntity importJob = new ImportJobEntity();
        importJob.setId(1L);
        importJob.setOrgId("test-org");

        Dossier existingDossier = new Dossier();
        existingDossier.setId(1L);
        existingDossier.setLeadPhone("+33612345678");

        when(importJobRepository.save(any(ImportJobEntity.class))).thenReturn(importJob);
        when(dossierRepository.findByLeadPhoneAndOrgIdAndStatusNotIn(
                        anyString(), anyString(), anyList()))
                .thenReturn(Collections.singletonList(existingDossier));

        LeadImportResponse response = leadImportService.importLeads(file, MergeStrategy.CREATE_NEW);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getErrorCount());
        assertEquals(0, response.getSkippedCount());

        ArgumentCaptor<Dossier> dossierCaptor = ArgumentCaptor.forClass(Dossier.class);
        verify(dossierRepository, times(1)).save(dossierCaptor.capture());

        Dossier savedDossier = dossierCaptor.getValue();
        assertEquals("John Doe", savedDossier.getLeadName());
        assertEquals("+33612345678", savedDossier.getLeadPhone());
    }

    @Test
    void testImportLeads_InvalidSource() {
        String csvContent =
                "name,phone,email,source,lead_source,notes,score\n"
                        + "John Doe,+33612345678,john@example.com,invalid_source,Website,Test note,85\n";

        MockMultipartFile file =
                new MockMultipartFile("file", "leads.csv", "text/csv", csvContent.getBytes());

        ImportJobEntity importJob = new ImportJobEntity();
        importJob.setId(1L);
        importJob.setOrgId("test-org");

        when(importJobRepository.save(any(ImportJobEntity.class))).thenReturn(importJob);

        LeadImportResponse response = leadImportService.importLeads(file, MergeStrategy.SKIP);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getErrorCount());
        assertTrue(response.getValidationErrors().size() > 0);
    }

    @Test
    void testImportLeads_InvalidScore() {
        String csvContent =
                "name,phone,email,source,lead_source,notes,score\n"
                        + "John Doe,+33612345678,john@example.com,web,Website,Test note,150\n";

        MockMultipartFile file =
                new MockMultipartFile("file", "leads.csv", "text/csv", csvContent.getBytes());

        ImportJobEntity importJob = new ImportJobEntity();
        importJob.setId(1L);
        importJob.setOrgId("test-org");

        when(importJobRepository.save(any(ImportJobEntity.class))).thenReturn(importJob);

        LeadImportResponse response = leadImportService.importLeads(file, MergeStrategy.SKIP);

        assertNotNull(response);
        assertEquals(1, response.getTotalRows());
        assertEquals(0, response.getSuccessCount());
        assertEquals(1, response.getErrorCount());
        assertTrue(response.getValidationErrors().size() > 0);
    }

    @Test
    void testImportLeads_NoOrgId() {
        TenantContext.clear();

        String csvContent =
                "name,phone,email,source,lead_source,notes,score\n"
                        + "John Doe,+33612345678,john@example.com,web,Website,Test note,85\n";

        MockMultipartFile file =
                new MockMultipartFile("file", "leads.csv", "text/csv", csvContent.getBytes());

        assertThrows(
                IllegalStateException.class,
                () -> {
                    leadImportService.importLeads(file, MergeStrategy.SKIP);
                });
    }
}
