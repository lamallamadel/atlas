package com.example.backend.service;

import com.example.backend.dto.DossierCreateRequest;
import com.example.backend.dto.DossierLeadPatchRequest;
import com.example.backend.dto.DossierMapper;
import com.example.backend.dto.DossierResponse;
import com.example.backend.dto.DossierStatusPatchRequest;
import com.example.backend.entity.Annonce;
import com.example.backend.entity.Dossier;
import com.example.backend.entity.enums.AnnonceStatus;
import com.example.backend.entity.enums.DossierStatus;
import com.example.backend.repository.AnnonceRepository;
import com.example.backend.repository.DossierRepository;
import com.example.backend.util.TenantContext;
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
    private final AnnonceRepository annonceRepository;

    public DossierService(DossierRepository dossierRepository, DossierMapper dossierMapper, AnnonceRepository annonceRepository) {
        this.dossierRepository = dossierRepository;
        this.dossierMapper = dossierMapper;
        this.annonceRepository = annonceRepository;
    }

    @Transactional
    public DossierResponse create(DossierCreateRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        if (request.getAnnonceId() != null) {
            Annonce annonce = annonceRepository.findById(request.getAnnonceId())
                    .orElseThrow(() -> new EntityNotFoundException("Annonce not found with id: " + request.getAnnonceId()));
            
            if (!orgId.equals(annonce.getOrgId())) {
                throw new EntityNotFoundException("Annonce not found with id: " + request.getAnnonceId());
            }
            
            if (annonce.getStatus() == AnnonceStatus.ARCHIVED) {
                throw new IllegalArgumentException("Cannot create dossier with ARCHIVED annonce");
            }
        }
        
        Dossier dossier = dossierMapper.toEntity(request);
        dossier.setOrgId(orgId);
        
        if (dossier.getParties() != null && !dossier.getParties().isEmpty()) {
            dossier.getParties().forEach(party -> party.setOrgId(orgId));
        }
        
        Dossier saved = dossierRepository.save(dossier);
        return dossierMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DossierResponse getById(Long id) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));
        
        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }
        
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
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));
        
        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }
        
        dossier.setStatus(request.getStatus());
        Dossier updated = dossierRepository.save(dossier);
        return dossierMapper.toResponse(updated);
    }

    @Transactional
    public DossierResponse patchLead(Long id, DossierLeadPatchRequest request) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        Dossier dossier = dossierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Dossier not found with id: " + id));
        
        if (!orgId.equals(dossier.getOrgId())) {
            throw new EntityNotFoundException("Dossier not found with id: " + id);
        }
        
        dossier.setLeadName(request.getLeadName());
        dossier.setLeadPhone(request.getLeadPhone());
        Dossier updated = dossierRepository.save(dossier);
        return dossierMapper.toResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<DossierResponse> checkForDuplicates(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return List.of();
        }
        
        List<DossierStatus> excludedStatuses = Arrays.asList(DossierStatus.WON, DossierStatus.LOST);
        List<Dossier> duplicates = dossierRepository.findByLeadPhoneAndStatusNotIn(phone, excludedStatuses);
        
        return duplicates.stream()
                .map(dossierMapper::toResponse)
                .collect(Collectors.toList());
    }
}
