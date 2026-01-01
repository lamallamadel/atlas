package com.example.backend.service;

import com.example.backend.dto.AnnonceCreateRequest;
import com.example.backend.dto.AnnonceMapper;
import com.example.backend.dto.AnnonceResponse;
import com.example.backend.dto.AnnonceUpdateRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.repository.AnnonceRepository;
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

import java.math.BigDecimal;
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
class AnnonceServiceTest {

    @Mock
    private AnnonceRepository annonceRepository;

    @Mock
    private AnnonceMapper annonceMapper;

    @InjectMocks
    private AnnonceService annonceService;

    private AnnonceCreateRequest createRequest;
    private Annonce annonce;
    private AnnonceResponse annonceResponse;

    @BeforeEach
    void setUp() {
        createRequest = new AnnonceCreateRequest();
        createRequest.setOrgId("org123");
        createRequest.setTitle("Test Annonce");
        createRequest.setDescription("Test Description");
        createRequest.setCategory("Electronics");
        createRequest.setCity("Paris");
        createRequest.setPrice(BigDecimal.valueOf(100.00));
        createRequest.setCurrency("EUR");

        annonce = new Annonce();
        annonce.setId(1L);
        annonce.setOrgId("org123");
        annonce.setTitle("Test Annonce");
        annonce.setDescription("Test Description");
        annonce.setCategory("Electronics");
        annonce.setCity("Paris");
        annonce.setPrice(BigDecimal.valueOf(100.00));
        annonce.setCurrency("EUR");
        annonce.setStatus(AnnonceStatus.DRAFT);
        annonce.setCreatedAt(LocalDateTime.now());
        annonce.setUpdatedAt(LocalDateTime.now());

        annonceResponse = new AnnonceResponse();
        annonceResponse.setId(1L);
        annonceResponse.setOrgId("org123");
        annonceResponse.setTitle("Test Annonce");
        annonceResponse.setDescription("Test Description");
        annonceResponse.setCategory("Electronics");
        annonceResponse.setCity("Paris");
        annonceResponse.setPrice(BigDecimal.valueOf(100.00));
        annonceResponse.setCurrency("EUR");
        annonceResponse.setStatus(AnnonceStatus.DRAFT);
        annonceResponse.setCreatedAt(LocalDateTime.now());
        annonceResponse.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void create_HappyPath_ReturnsCreatedAnnonce() {
        when(annonceMapper.toEntity(createRequest)).thenReturn(annonce);
        when(annonceRepository.save(annonce)).thenReturn(annonce);
        when(annonceMapper.toResponse(annonce)).thenReturn(annonceResponse);

        AnnonceResponse result = annonceService.create(createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getOrgId()).isEqualTo("org123");
        assertThat(result.getTitle()).isEqualTo("Test Annonce");
        assertThat(result.getDescription()).isEqualTo("Test Description");
        assertThat(result.getCategory()).isEqualTo("Electronics");
        assertThat(result.getCity()).isEqualTo("Paris");
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(100.00));
        assertThat(result.getCurrency()).isEqualTo("EUR");
        assertThat(result.getStatus()).isEqualTo(AnnonceStatus.DRAFT);

        verify(annonceMapper).toEntity(createRequest);
        verify(annonceRepository).save(annonce);
        verify(annonceMapper).toResponse(annonce);
    }

    @Test
    void create_ValidatesRequiredFields() {
        when(annonceMapper.toEntity(any(AnnonceCreateRequest.class))).thenReturn(annonce);
        when(annonceRepository.save(any(Annonce.class))).thenReturn(annonce);
        when(annonceMapper.toResponse(any(Annonce.class))).thenReturn(annonceResponse);

        AnnonceResponse result = annonceService.create(createRequest);

        assertThat(result).isNotNull();
        ArgumentCaptor<AnnonceCreateRequest> requestCaptor = ArgumentCaptor.forClass(AnnonceCreateRequest.class);
        verify(annonceMapper).toEntity(requestCaptor.capture());
        
        AnnonceCreateRequest capturedRequest = requestCaptor.getValue();
        assertThat(capturedRequest.getOrgId()).isNotBlank();
        assertThat(capturedRequest.getTitle()).isNotBlank();
    }

    @Test
    void getById_HappyPath_ReturnsAnnonce() {
        when(annonceRepository.findById(1L)).thenReturn(Optional.of(annonce));
        when(annonceMapper.toResponse(annonce)).thenReturn(annonceResponse);

        AnnonceResponse result = annonceService.getById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Test Annonce");
        verify(annonceRepository).findById(1L);
        verify(annonceMapper).toResponse(annonce);
    }

    @Test
    void getById_NotFound_ThrowsEntityNotFoundException() {
        when(annonceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> annonceService.getById(999L))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Annonce not found with id: 999");

        verify(annonceRepository).findById(999L);
        verify(annonceMapper, never()).toResponse(any());
    }

    @Test
    void update_HappyPath_ReturnsUpdatedAnnonce() {
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setStatus(AnnonceStatus.PUBLISHED);

        Annonce updatedAnnonce = new Annonce();
        updatedAnnonce.setId(1L);
        updatedAnnonce.setOrgId("org123");
        updatedAnnonce.setTitle("Updated Title");
        updatedAnnonce.setStatus(AnnonceStatus.PUBLISHED);

        AnnonceResponse updatedResponse = new AnnonceResponse();
        updatedResponse.setId(1L);
        updatedResponse.setTitle("Updated Title");
        updatedResponse.setStatus(AnnonceStatus.PUBLISHED);

        when(annonceRepository.findById(1L)).thenReturn(Optional.of(annonce));
        doNothing().when(annonceMapper).updateEntity(annonce, updateRequest);
        when(annonceRepository.save(annonce)).thenReturn(updatedAnnonce);
        when(annonceMapper.toResponse(updatedAnnonce)).thenReturn(updatedResponse);

        AnnonceResponse result = annonceService.update(1L, updateRequest);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getStatus()).isEqualTo(AnnonceStatus.PUBLISHED);

        verify(annonceRepository).findById(1L);
        verify(annonceMapper).updateEntity(annonce, updateRequest);
        verify(annonceRepository).save(annonce);
        verify(annonceMapper).toResponse(updatedAnnonce);
    }

    @Test
    void update_NotFound_ThrowsEntityNotFoundException() {
        AnnonceUpdateRequest updateRequest = new AnnonceUpdateRequest();
        updateRequest.setTitle("Updated Title");

        when(annonceRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> annonceService.update(999L, updateRequest))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Annonce not found with id: 999");

        verify(annonceRepository).findById(999L);
        verify(annonceMapper, never()).updateEntity(any(), any());
        verify(annonceRepository, never()).save(any());
    }

    @Test
    void list_NoFilters_ReturnsAllAnnonces() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Annonce> annonces = Arrays.asList(annonce);
        Page<Annonce> annoncePages = new PageImpl<>(annonces, pageable, 1);

        when(annonceRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(annoncePages);
        when(annonceMapper.toResponse(annonce)).thenReturn(annonceResponse);

        Page<AnnonceResponse> result = annonceService.list(null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getTotalElements()).isEqualTo(1);
        verify(annonceRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithStatusFilter_ReturnsFilteredAnnonces() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Annonce> annonces = Arrays.asList(annonce);
        Page<Annonce> annoncePages = new PageImpl<>(annonces, pageable, 1);

        when(annonceRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(annoncePages);
        when(annonceMapper.toResponse(annonce)).thenReturn(annonceResponse);

        Page<AnnonceResponse> result = annonceService.list(AnnonceStatus.DRAFT, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getStatus()).isEqualTo(AnnonceStatus.DRAFT);
        verify(annonceRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithSearchQuery_ReturnsMatchingAnnonces() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Annonce> annonces = Arrays.asList(annonce);
        Page<Annonce> annoncePages = new PageImpl<>(annonces, pageable, 1);

        when(annonceRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(annoncePages);
        when(annonceMapper.toResponse(annonce)).thenReturn(annonceResponse);

        Page<AnnonceResponse> result = annonceService.list(null, "Test", pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(annonceRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_WithStatusAndSearchQuery_ReturnsFilteredAndMatchingAnnonces() {
        Pageable pageable = PageRequest.of(0, 20);
        List<Annonce> annonces = Arrays.asList(annonce);
        Page<Annonce> annoncePages = new PageImpl<>(annonces, pageable, 1);

        when(annonceRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(annoncePages);
        when(annonceMapper.toResponse(annonce)).thenReturn(annonceResponse);

        Page<AnnonceResponse> result = annonceService.list(AnnonceStatus.DRAFT, "Test", pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        verify(annonceRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void list_EmptyResult_ReturnsEmptyPage() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Annonce> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        when(annonceRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage);

        Page<AnnonceResponse> result = annonceService.list(null, null, pageable);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isEqualTo(0);
        verify(annonceRepository).findAll(any(Specification.class), eq(pageable));
    }
}
