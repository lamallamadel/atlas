package com.example.backend.service;

import com.example.backend.entity.ReferentialEntity;
import com.example.backend.entity.ReferentialVersionEntity;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.repository.ReferentialRepository;
import com.example.backend.repository.ReferentialVersionRepository;
import com.example.backend.util.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReferentialService {

    private final ReferentialRepository referentialRepository;
    private final ReferentialVersionRepository versionRepository;

    public ReferentialService(ReferentialRepository referentialRepository,
                             ReferentialVersionRepository versionRepository) {
        this.referentialRepository = referentialRepository;
        this.versionRepository = versionRepository;
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
        entity.setVersion(1L);
        entity.setLastChangeType("CREATED");
        
        ReferentialEntity saved = referentialRepository.save(entity);
        
        createVersion(saved, ReferentialVersionEntity.ReferentialChangeType.CREATED, null);
        
        return saved;
    }

    @Transactional
    public ReferentialEntity update(Long id, ReferentialEntity updatedEntity) {
        return update(id, updatedEntity, null);
    }

    @Transactional
    public ReferentialEntity update(Long id, ReferentialEntity updatedEntity, String changeReason) {
        ReferentialEntity existing = getById(id);

        if (existing.getIsSystem()) {
            throw new IllegalStateException("Cannot modify system-defined referential items");
        }

        boolean activeChanged = !existing.getIsActive().equals(updatedEntity.getIsActive());
        
        existing.setLabel(updatedEntity.getLabel());
        existing.setDescription(updatedEntity.getDescription());
        existing.setDisplayOrder(updatedEntity.getDisplayOrder());
        existing.setIsActive(updatedEntity.getIsActive());
        existing.setVersion(existing.getVersion() + 1);
        
        ReferentialVersionEntity.ReferentialChangeType changeType;
        if (activeChanged) {
            changeType = updatedEntity.getIsActive() 
                ? ReferentialVersionEntity.ReferentialChangeType.ACTIVATED 
                : ReferentialVersionEntity.ReferentialChangeType.DEACTIVATED;
        } else {
            changeType = ReferentialVersionEntity.ReferentialChangeType.UPDATED;
        }
        
        existing.setLastChangeType(changeType.name());
        
        ReferentialEntity saved = referentialRepository.save(existing);
        
        createVersion(saved, changeType, changeReason);
        
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        delete(id, null);
    }

    @Transactional
    public void delete(Long id, String changeReason) {
        ReferentialEntity existing = getById(id);

        if (existing.getIsSystem()) {
            throw new IllegalStateException("Cannot delete system-defined referential items");
        }

        createVersion(existing, ReferentialVersionEntity.ReferentialChangeType.DELETED, changeReason);

        referentialRepository.delete(existing);
    }

    @Transactional(readOnly = true)
    public boolean exists(String category, String code) {
        return referentialRepository.existsByCategoryAndCode(category, code);
    }

    @Transactional(readOnly = true)
    public List<ReferentialVersionEntity> getVersionHistory(Long referentialId) {
        return versionRepository.findByReferentialIdOrderByCreatedAtDesc(referentialId);
    }

    @Transactional(readOnly = true)
    public List<ReferentialVersionEntity> getCategoryVersionHistory(String category) {
        return versionRepository.findByCategoryOrderByCreatedAtDesc(category);
    }

    private void createVersion(ReferentialEntity entity, ReferentialVersionEntity.ReferentialChangeType changeType, String changeReason) {
        ReferentialVersionEntity version = new ReferentialVersionEntity();
        version.setOrgId(entity.getOrgId());
        version.setReferentialId(entity.getId());
        version.setCategory(entity.getCategory());
        version.setCode(entity.getCode());
        version.setLabel(entity.getLabel());
        version.setDescription(entity.getDescription());
        version.setDisplayOrder(entity.getDisplayOrder());
        version.setIsActive(entity.getIsActive());
        version.setIsSystem(entity.getIsSystem());
        version.setChangeType(changeType);
        version.setChangeReason(changeReason);
        
        versionRepository.save(version);
    }
}
