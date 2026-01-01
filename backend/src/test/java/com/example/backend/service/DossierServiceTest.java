package com.example.backend.service;

import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DossierServiceTest {

    @Mock
    private DossierRepository dossierRepository;

    @Mock
    private DossierMapper dossierMapper;

    @InjectMocks
    private DossierService dossierService;

    private DossierCreateRequest createRequest;
    private Dossier dossier;
    private DossierResponse dossierResponse;

    @BeforeEach
    void setUp() {
        createRequest = new DossierCreateRequest();
        createRequest.setOrgId("org123");
        createRequest.setLeadPhone("+33612345678");
        createRequest.setLeadName("John Doe");
        createRequest.setLeadSource("Website");
        createRequest.setAnnonceId(1L);

        dossier = new Dossier();
        dossier.setId(1L);
        dossier.setOrgId("org123");
        dossier.setLeadPhone("+33612345678");
        dossier.setLeadName("John Doe");
        dossier.setLeadSource("Website");
        dossier.setAnnonceId(1L);
        dossier.setStatus(DossierStatus.NEW);
        dossier.setCreatedAt(LocalDateTime.now());
        dossier.setUpdatedAt(LocalDateTime.now());

        dossierResponse = new DossierResponse();
        dossierResponse.setId(1L);
        dossierResponse.setOrgId("org123");
        dossierResponse.setLeadPhone("+33612345678");
        dossierResponse.setLeadName("John Doe");
        dossierResponse.setLeadSource("Website");
        dossierResponse.setAnnonceId(1L);
        dossierResponse.setStatus(DossierStatus.NEW);
        dossierResponse.setCreatedAt(LocalDateTime.now());
        dossierResponse.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void create_HappyPath_ReturnsCreatedDossier() {
        when(dossierMapper.toEntity(createRequest)).thenReturn(dossier);
        when(dossierRepository.save(dossier)).thenReturn(dossier);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        DossierResponse result = dossierService.create(createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getOrgId()).isEqualTo("org123");
        assertThat(result.getLeadPhone()).isEqualTo("+33612345678");
        assertThat(result.getLeadName()).isEqualTo("John Doe");
        assertThat(result.getLeadSource()).isEqualTo("Website");
        assertThat(result.getAnnonceId()).isEqualTo(1L);
        assertThat(result.getStatus()).isEqualTo(DossierStatus.NEW);

        verify(dossierMapper).toEntity(createRequest);
        verify(dossierRepository).save(dossier);
        verify(dossierMapper).toResponse(dossier);
    }

    @Test
    void create_ValidatesRequiredFields() {
        when(dossierMapper.toEntity(any(DossierCreateRequest.class))).thenReturn(dossier);
        when(dossierRepository.save(any(Dossier.class))).thenReturn(dossier);
        when(dossierMapper.toResponse(any(Dossier.class))).thenReturn(dossierResponse);

        DossierResponse result = dossierService.create(createRequest);

        assertThat(result).isNotNull();
        ArgumentCaptor<DossierCreateRequest> requestCaptor = ArgumentCaptor.forClass(DossierCreateRequest.class);
        verify(dossierMapper).toEntity(requestCaptor.capture());
        
        DossierCreateRequest capturedRequest = requestCaptor.getValue();
        assertThat(capturedRequest.getOrgId()).isNotBlank();
    }

    @Test
    void getById_HappyPath_ReturnsDossier() {
        when(dossierRepository.findById(1L)).thenReturn(Optional.of(dossier));
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        DossierResponse result = dossierService.getById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getLeadPhone()).isEqualTo("+33612345678");
        verify(dossierRepository).findById(1L);
        verify(dossierMapper).toResponse(dossier);
    }

    @Test
    void getById_NotFound_ThrowsEntityNotFoundException() {
        when(dossierRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dossierService.getById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Dossier not found with id: 999");

        verify(dossierRepository).findById(999L);
        verify(dossierMapper, never()).toResponse(any());
    }

    @Test
    void patchStatus_HappyPath_ReturnsUpdatedDossier() {
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        Dossier updatedDossier = new Dossier();
        updatedDossier.setId(1L);
        updatedDossier.setOrgId("org123");
        updatedDossier.setStatus(DossierStatus.QUALIFIED);

        DossierResponse updatedResponse = new DossierResponse();
        updatedResponse.setId(1L);
        updatedResponse.setStatus(DossierStatus.QUALIFIED);

        when(dossierRepository.findById(1L)).thenReturn(Optional.of(dossier));
        when(dossierRepository.save(dossier)).thenReturn(updatedDossier);
        when(dossierMapper.toResponse(updatedDossier)).thenReturn(updatedResponse);

        DossierResponse result = dossierService.patchStatus(1L, patchRequest);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getStatus()).isEqualTo(DossierStatus.QUALIFIED);

        verify(dossierRepository).findById(1L);
        verify(dossierRepository).save(dossier);
        verify(dossierMapper).toResponse(updatedDossier);
        assertThat(dossier.getStatus()).isEqualTo(DossierStatus.QUALIFIED);
    }

    @Test
    void patchStatus_NotFound_ThrowsEntityNotFoundException() {
        DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
        patchRequest.setStatus(DossierStatus.QUALIFIED);

        when(dossierRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dossierService.patchStatus(999L, patchRequest))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Dossier not found with id: 999");

        verify(dossierRepository).findById(999L);
        verify(dossierRepository, never()).save(any());
    }

    @Test
    void patchStatus_AllStatuses_UpdatesCorrectly() {
        for (DossierStatus targetStatus : DossierStatus.values()) {
            DossierStatusPatchRequest patchRequest = new DossierStatusPatchRequest();
            patchRequest.setStatus(targetStatus);

            Dossier dossierToUpdate = new Dossier();
            dossierToUpdate.setId(1L);
            dossierToUpdate.setOrgId("org123");
            dossierToUpdate.setStatus(DossierStatus.NEW);

            when(dossierRepository.findById(1L)).thenReturn(Optional.of(dossierToUpdate));
            when(dossierRepository.save(dossierToUpdate)).thenReturn(dossierToUpdate);
            when(dossierMapper.toResponse(dossierToUpdate)).thenReturn(dossierResponse);

            dossierService.patchStatus(1L, patchRequest);

            assertThat(dossierToUpdate.getStatus()).isEqualTo(targetStatus);
        }
    }

    @Test
    void list_NoFilters_ReturnsAllDossiers() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Dossier> dossiers = Arrays.asList(dossier);
        Page<Dossier> dossierPages = new PageImpl<>(dossiers, pageable, 1);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(dossierPages);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        Page<DossierResponse> result = dossierService.list(null, null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithStatusFilter_ReturnsFilteredDossiers() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Dossier> dossiers = Arrays.asList(dossier);
        Page<Dossier> dossierPages = new PageImpl<>(dossiers, pageable, 1);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(dossierPages);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        Page<DossierResponse> result = dossierService.list(DossierStatus.NEW, null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(DossierStatus.NEW);
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithLeadPhoneFilter_ReturnsFilteredDossiers() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Dossier> dossiers = Arrays.asList(dossier);
        Page<Dossier> dossierPages = new PageImpl<>(dossiers, pageable, 1);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(dossierPages);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        Page<DossierResponse> result = dossierService.list(null, "+33612345678", null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getLeadPhone()).isEqualTo("+33612345678");
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithAnnonceIdFilter_ReturnsFilteredDossiers() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Dossier> dossiers = Arrays.asList(dossier);
        Page<Dossier> dossierPages = new PageImpl<>(dossiers, pageable, 1);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(dossierPages);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        Page<DossierResponse> result = dossierService.list(null, null, 1L, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getAnnonceId()).isEqualTo(1L);
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithStatusAndPhoneFilter_ReturnsFilteredDossiers() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Dossier> dossiers = Arrays.asList(dossier);
        Page<Dossier> dossierPages = new PageImpl<>(dossiers, pageable, 1);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(dossierPages);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        Page<DossierResponse> result = dossierService.list(DossierStatus.NEW, "+33612345678", null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(DossierStatus.NEW);
        assertThat(result.getContent().get(0).getLeadPhone()).isEqualTo("+33612345678");
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithAllFilters_ReturnsFilteredDossiers() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Dossier> dossiers = Arrays.asList(dossier);
        Page<Dossier> dossierPages = new PageImpl<>(dossiers, pageable, 1);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(dossierPages);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        Page<DossierResponse> result = dossierService.list(DossierStatus.NEW, "+33612345678", 1L, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_EmptyResult_ReturnsEmptyPage() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Dossier> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage);

        Page<DossierResponse> result = dossierService.list(null, null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithEmptyPhoneString_IgnoresPhoneFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Dossier> dossiers = Arrays.asList(dossier);
        Page<Dossier> dossierPages = new PageImpl<>(dossiers, pageable, 1);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(dossierPages);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        Page<DossierResponse> result = dossierService.list(null, "", null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithWhitespacePhoneString_IgnoresPhoneFilter() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Dossier> dossiers = Arrays.asList(dossier);
        Page<Dossier> dossierPages = new PageImpl<>(dossiers, pageable, 1);

        when(dossierRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(dossierPages);
        when(dossierMapper.toResponse(dossier)).thenReturn(dossierResponse);

        Page<DossierResponse> result = dossierService.list(null, "   ", null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(dossierRepository).findAll(any(Specification.class), eq(pageable));
    }
}
