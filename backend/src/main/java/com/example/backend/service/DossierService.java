package com.example.backend.service;

import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.DossierRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DossierService {

    private final DossierRepository dossierRepository;
    private final DossierMapper dossierMapper;

    public DossierService(DossierRepository dossierRepository, DossierMapper dossierMapper) {
        this.dossierRepository = dossierRepository;
        this.dossierMapper = dossierMapper;
    }

    @Transactional
    public DossierResponse create(DossierCreateRequest request) {
        Dossier dossier = dossierMapper.toEntity(request);
        Dossier saved = dossierRepository.save(dossier);
        return dossierMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DossierResponse getById(Long id) {
        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));
        return dossierMapper.toResponse(dossier);
    }

    @Transactional(readOnly = true)
    public Page<DossierResponse> list(DossierStatus status, String leadPhone, Long annonceId, Pageable pageable) {
        Specification<Dossier> spec = Specification.where(null);

        if (status != null) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (leadPhone != null && !leadPhone.trim().isEmpty()) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("leadPhone"), leadPhone));
        }

        if (annonceId != null) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("annonceId"), annonceId));
        }

        Page<Dossier> dossiers = dossierRepository.findAll(spec, pageable);
        return dossiers.map(dossierMapper::toResponse);
    }

    @Transactional
    public DossierResponse patchStatus(Long id, DossierStatusPatchRequest request) {
        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));
        dossier.setStatus(request.getStatus());
        Dossier updated = dossierRepository.save(dossier);
        return dossierMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<DossierResponse> checkForDuplicates(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return List.of();
        }
        
        List<DossierStatus> excludedStatuses = Arrays.asList(DossierStatus.WON, DossierStatus.LOST);
        List<Dossier> duplicates = dossierRepository.findByPartiesPhoneAndStatusNotIn(phone, excludedStatuses);
        
        return duplicates.stream()
                .map(dossierMapper::toResponse)
                .collect(Collectors.toList());
    }
}
