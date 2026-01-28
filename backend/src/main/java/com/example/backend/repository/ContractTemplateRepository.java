package com.example.backend.repository;

import com.example.backend.entity.ContractTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContractTemplateRepository extends JpaRepository<ContractTemplateEntity, Long> {
    
    List<ContractTemplateEntity> findByOrgIdAndIsActiveTrue(String orgId);
    
    List<ContractTemplateEntity> findByOrgIdAndTemplateType(String orgId, String templateType);
    
    Optional<ContractTemplateEntity> findByIdAndOrgId(Long id, String orgId);
}
