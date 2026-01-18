package com.example.backend.service;

import com.example.backend.entity.ReferentialEntity;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.ReferentialRepository;
import com.example.backend.util.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReferentialService {

    private final ReferentialRepository referentialRepository;

    public ReferentialService(ReferentialRepository referentialRepository) {
        this.referentialRepository = referentialRepository;
    }

    @Transactional(readOnly = true)
    public List<ReferentialEntity> getAllByCategory(String category) {
        return referentialRepository.findByCategoryOrderByDisplayOrderAsc(category);
    }

    @Transactional(readOnly = true)
    public List<ReferentialEntity> getActiveByCategory(String category) {
        return referentialRepository.findByCategoryAndIsActiveTrueOrderByDisplayOrderAsc(category);
    }

    @Transactional(readOnly = true)
    public ReferentialEntity getById(Long id) {
        return referentialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Referential not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public ReferentialEntity getByCategoryAndCode(String category, String code) {
        return referentialRepository.findByCategoryAndCode(category, code)
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("Referential not found with category: %s and code: %s", category, code)));
    }

    @Transactional
    public ReferentialEntity create(ReferentialEntity entity) {
        String orgId = TenantContext.getOrgId();
        if (orgId == null) {
            throw new IllegalStateException("Organization ID not found in context");
        }

        if (referentialRepository.existsByCategoryAndCode(entity.getCategory(), entity.getCode())) {
            throw new IllegalArgumentException(
                    String.format("Referential already exists with category: %s and code: %s",
                            entity.getCategory(), entity.getCode()));
        }

        entity.setOrgId(orgId);
        return referentialRepository.save(entity);
    }

    @Transactional
    public ReferentialEntity update(Long id, ReferentialEntity updatedEntity) {
        ReferentialEntity existing = getById(id);

        if (existing.getIsSystem()) {
            throw new IllegalStateException("Cannot modify system-defined referential items");
        }

        existing.setLabel(updatedEntity.getLabel());
        existing.setDescription(updatedEntity.getDescription());
        existing.setDisplayOrder(updatedEntity.getDisplayOrder());
        existing.setIsActive(updatedEntity.getIsActive());

        return referentialRepository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        ReferentialEntity existing = getById(id);

        if (existing.getIsSystem()) {
            throw new IllegalStateException("Cannot delete system-defined referential items");
        }

        referentialRepository.delete(existing);
    }

    @Transactional(readOnly = true)
    public boolean exists(String category, String code) {
        return referentialRepository.existsByCategoryAndCode(category, code);
    }
}
